//! Native OAuth and authenticated Firestore transport. Tokens never cross IPC.
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use reqwest::blocking::{Client, Response};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{
    io::{Read, Write},
    net::TcpListener,
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Arc, Mutex,
    },
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    uid: String,
    email: Option<String>,
    display_name: Option<String>,
    photo_url: Option<String>,
}
#[derive(Clone, Serialize, Deserialize)]
struct Session {
    #[serde(default, rename = "projectId")]
    project_id: String,
    user: User,
    refresh: String,
    #[serde(skip)]
    token: String,
    #[serde(skip)]
    expires: u64,
}
#[derive(Default, Clone)]
pub struct Cloud(Arc<Mutex<Option<Session>>>);
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    user: Option<User>,
    configured: bool,
    project_id: Option<String>,
    persistent: bool,
}
#[derive(Deserialize)]
pub struct Constraint {
    kind: String,
    value: Value,
    direction: Option<String>,
}
#[derive(Deserialize)]
pub struct Operation {
    kind: String,
    path: String,
    data: Option<Value>,
}
#[derive(Serialize)]
pub struct Row {
    path: String,
    data: Value,
}

fn config() -> Result<(&'static str, &'static str, &'static str), String> {
    let api = option_env!("VITE_FIREBASE_API_KEY").unwrap_or("");
    let project = option_env!("VITE_FIREBASE_PROJECT_ID").unwrap_or("");
    let client = option_env!("FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID").unwrap_or("");
    if api.is_empty()
        || client.is_empty()
        || !project
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-')
        || project.is_empty()
    {
        return Err("cloud-not-configured".into());
    }
    Ok((api, project, client))
}
fn now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}
fn client() -> Result<Client, String> {
    Client::builder()
        .https_only(true)
        .redirect(reqwest::redirect::Policy::none())
        .timeout(Duration::from_secs(20))
        .build()
        .map_err(|_| "cloud-network-error".into())
}
fn response(res: Result<Response, reqwest::Error>) -> Result<Value, String> {
    let mut res = res.map_err(|_| "cloud-network-error")?;
    if !res.status().is_success() {
        return Err(format!("cloud-http-{}", res.status().as_u16()));
    }
    let mut bytes = Vec::new();
    res.by_ref()
        .take(16 * 1024 * 1024 + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| "cloud-network-error")?;
    if bytes.len() > 16 * 1024 * 1024 {
        return Err("cloud-response-too-large".into());
    }
    serde_json::from_slice(&bytes).map_err(|_| "cloud-invalid-response".into())
}
fn credential() -> Result<keyring::Entry, String> {
    let (_, project, _) = config()?;
    keyring::Entry::new(
        "ink.focusflow.desktop",
        &format!("firebase-refresh:{project}"),
    )
    .map_err(|_| "credential-store-unavailable".into())
}
fn stored_session(value: &str, project: &str) -> Option<Session> {
    serde_json::from_str::<Session>(value)
        .ok()
        .filter(|session| {
            session.project_id == project
                && !session.user.uid.is_empty()
                && !session.refresh.is_empty()
        })
}
fn persist(session: &Session) -> bool {
    credential()
        .and_then(|entry| {
            entry
                .set_password(
                    &serde_json::to_string(session).map_err(|_| "credential-store-unavailable")?,
                )
                .map_err(|_| "credential-store-unavailable".into())
        })
        .is_ok()
}
fn random() -> Result<String, String> {
    let mut bytes = [0; 32];
    getrandom::fill(&mut bytes).map_err(|_| "oauth-random-error")?;
    Ok(URL_SAFE_NO_PAD.encode(bytes))
}
fn main_window(window: &tauri::WebviewWindow) -> Result<(), String> {
    if window.label() == "main" {
        Ok(())
    } else {
        Err("Cloud access forbidden for this window".into())
    }
}

static AUTH_PENDING: AtomicBool = AtomicBool::new(false);
static AUTH_GENERATION: AtomicU64 = AtomicU64::new(0);
struct AuthGuard;
impl Drop for AuthGuard {
    fn drop(&mut self) {
        AUTH_PENDING.store(false, Ordering::SeqCst);
    }
}

fn sign_in(cloud: Cloud, generation: u64) -> Result<User, String> {
    let (api, project, oauth_client) = config()?;
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|_| "oauth-listener-error")?;
    listener
        .set_nonblocking(true)
        .map_err(|_| "oauth-listener-error")?;
    let redirect = format!(
        "http://127.0.0.1:{}/callback",
        listener
            .local_addr()
            .map_err(|_| "oauth-listener-error")?
            .port()
    );
    let state = random()?;
    let verifier = random()?;
    let challenge = URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()));
    let mut url = reqwest::Url::parse("https://accounts.google.com/o/oauth2/v2/auth").unwrap();
    url.query_pairs_mut().extend_pairs([
        ("client_id", oauth_client),
        ("redirect_uri", redirect.as_str()),
        ("response_type", "code"),
        ("scope", "openid email profile"),
        ("state", state.as_str()),
        ("code_challenge", challenge.as_str()),
        ("code_challenge_method", "S256"),
        ("prompt", "select_account"),
    ]);
    open::that(url.as_str()).map_err(|_| "oauth-browser-error")?;
    let deadline = Instant::now() + Duration::from_secs(120);
    let code = loop {
        if AUTH_GENERATION.load(Ordering::SeqCst) != generation {
            return Err("oauth-cancelled".into());
        }
        if Instant::now() > deadline {
            return Err("oauth-timeout".into());
        }
        match listener.accept() {
            Ok((mut stream, peer)) => {
                if !peer.ip().is_loopback() {
                    continue;
                }
                stream.set_read_timeout(Some(Duration::from_secs(2))).ok();
                let mut buffer = [0; 8192];
                let count = match stream.read(&mut buffer) {
                    Ok(count) => count,
                    Err(_) => continue,
                };
                let raw = String::from_utf8_lossy(&buffer[..count]);
                let target = raw
                    .lines()
                    .next()
                    .and_then(|line| line.strip_prefix("GET "))
                    .and_then(|line| line.split(' ').next())
                    .unwrap_or("");
                let parsed = reqwest::Url::parse(&format!("http://127.0.0.1{target}"));
                let params = parsed
                    .as_ref()
                    .ok()
                    .map(|url| {
                        url.query_pairs()
                            .into_owned()
                            .collect::<std::collections::HashMap<_, _>>()
                    })
                    .unwrap_or_default();
                if parsed
                    .as_ref()
                    .map(|url| url.path() != "/callback")
                    .unwrap_or(true)
                    || params.get("state") != Some(&state)
                {
                    let _ = stream.write_all(b"HTTP/1.1 400 Bad Request\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
                    continue;
                }
                let body = "You may close this tab and return to Focus Flow.";
                let _ = stream.write_all(format!("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nCache-Control: no-store\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len()).as_bytes());
                break params.get("code").cloned().ok_or("oauth-cancelled")?;
            }
            Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                std::thread::sleep(Duration::from_millis(50))
            }
            Err(_) => return Err("oauth-listener-error".into()),
        }
    };
    drop(listener);
    let http = client()?;
    let tokens = response(
        http.post("https://oauth2.googleapis.com/token")
            .form(&[
                ("code", code.as_str()),
                ("client_id", oauth_client),
                ("redirect_uri", redirect.as_str()),
                ("grant_type", "authorization_code"),
                ("code_verifier", verifier.as_str()),
            ])
            .send(),
    )?;
    let google_token = tokens["id_token"].as_str().ok_or("oauth-invalid-token")?;
    let mut post_body = reqwest::Url::parse("https://localhost/").unwrap();
    post_body
        .query_pairs_mut()
        .append_pair("id_token", google_token)
        .append_pair("providerId", "google.com");
    let firebase = response(http.post(format!("https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key={api}")).json(&json!({"postBody": post_body.query().unwrap(), "requestUri":"http://localhost", "returnSecureToken":true})).send())?;
    let session = Session {
        project_id: project.into(),
        user: User {
            uid: firebase["localId"]
                .as_str()
                .ok_or("oauth-invalid-user")?
                .into(),
            email: firebase["email"].as_str().map(String::from),
            display_name: firebase["displayName"].as_str().map(String::from),
            photo_url: firebase["photoUrl"].as_str().map(String::from),
        },
        refresh: firebase["refreshToken"]
            .as_str()
            .ok_or("oauth-invalid-token")?
            .into(),
        token: firebase["idToken"]
            .as_str()
            .ok_or("oauth-invalid-token")?
            .into(),
        expires: now() + 3500,
    };
    let mut guard = cloud.0.lock().map_err(|_| "cloud-lock-error")?;
    if AUTH_GENERATION.load(Ordering::SeqCst) != generation {
        return Err("oauth-cancelled".into());
    }
    persist(&session); // Unavailable OS store means a memory-only session, never a plaintext file.
    let user = session.user.clone();
    *guard = Some(session);
    Ok(user)
}
fn authenticated(cloud: &Cloud) -> Result<Session, String> {
    let (api, project, _) = config()?;
    let mut guard = cloud.0.lock().map_err(|_| "cloud-lock-error")?;
    if guard.is_none() {
        *guard = credential()
            .ok()
            .and_then(|entry| entry.get_password().ok())
            .and_then(|secret| stored_session(&secret, project));
    }
    let session = guard.as_mut().ok_or("cloud-sign-in-required")?;
    if session.project_id != project {
        return Err("cloud-sign-in-required".into());
    }
    if session.expires < now() + 60 {
        let result = response(
            client()?
                .post(format!(
                    "https://securetoken.googleapis.com/v1/token?key={api}"
                ))
                .form(&[
                    ("grant_type", "refresh_token"),
                    ("refresh_token", session.refresh.as_str()),
                ])
                .send(),
        )?;
        if result["user_id"].as_str() != Some(session.user.uid.as_str()) {
            return Err("cloud-account-mismatch".into());
        }
        session.token = result["id_token"]
            .as_str()
            .ok_or("cloud-invalid-token")?
            .into();
        session.refresh = result["refresh_token"]
            .as_str()
            .ok_or("cloud-invalid-token")?
            .into();
        session.expires = now() + 3500;
        persist(session);
    }
    Ok(session.clone())
}
fn document_path(path: &str, uid: &str, collection: bool) -> Result<(), String> {
    let parts: Vec<_> = path.split('/').collect();
    let allowed = [
        "sessions",
        "tombstones",
        "settings",
        "stats",
        "sound_prefs",
        "interface",
        "metadata",
        "daily_history",
    ];
    if parts.len() != if collection { 3 } else { 4 }
        || parts[0] != "users"
        || parts[1] != uid
        || !allowed.contains(&parts[2])
        || parts.iter().any(|part| {
            part.is_empty()
                || part.len() > 128
                || !part
                    .chars()
                    .all(|ch| ch.is_ascii_alphanumeric() || ch == '_' || ch == '-')
        })
    {
        return Err("cloud-path-forbidden".into());
    }
    Ok(())
}
fn base() -> Result<String, String> {
    Ok(format!(
        "projects/{}/databases/(default)/documents",
        config()?.1
    ))
}
fn encode(value: &Value) -> Value {
    match value {
        Value::Null => json!({"nullValue": null}),
        Value::Bool(v) => json!({"booleanValue": v}),
        Value::String(v) => json!({"stringValue": v}),
        Value::Number(v) if v.is_i64() || v.is_u64() => json!({"integerValue":v.to_string()}),
        Value::Number(v) => json!({"doubleValue":v}),
        Value::Array(values) => {
            json!({"arrayValue":{"values":values.iter().map(encode).collect::<Vec<_>>()}})
        }
        Value::Object(values) => {
            json!({"mapValue":{"fields":values.iter().map(|(k,v)|(k.clone(),encode(v))).collect::<serde_json::Map<_,_>>()}})
        }
    }
}
fn decode(value: &Value) -> Value {
    if let Some(v) = value
        .get("stringValue")
        .or(value.get("booleanValue"))
        .or(value.get("doubleValue"))
    {
        return v.clone();
    }
    if let Some(v) = value
        .get("integerValue")
        .and_then(Value::as_str)
        .and_then(|v| v.parse::<i64>().ok())
    {
        return json!(v);
    }
    if let Some(v) = value.get("mapValue") {
        return Value::Object(
            v["fields"]
                .as_object()
                .map(|fields| fields.iter().map(|(k, v)| (k.clone(), decode(v))).collect())
                .unwrap_or_default(),
        );
    }
    if let Some(v) = value.get("arrayValue") {
        return Value::Array(
            v["values"]
                .as_array()
                .map(|items| items.iter().map(decode).collect())
                .unwrap_or_default(),
        );
    }
    Value::Null
}
fn row(document: &Value) -> Result<Row, String> {
    let name = document["name"].as_str().ok_or("cloud-invalid-document")?;
    let path = name
        .split_once("/documents/")
        .ok_or("cloud-invalid-document")?
        .1
        .into();
    Ok(Row {
        path,
        data: decode(&json!({"mapValue":{"fields":document["fields"]}})),
    })
}

#[tauri::command]
pub fn cloud_status(
    state: tauri::State<Cloud>,
    window: tauri::WebviewWindow,
) -> Result<Status, String> {
    main_window(&window)?;
    let stored = credential()
        .ok()
        .and_then(|entry| entry.get_password().ok())
        .and_then(|value| {
            config()
                .ok()
                .and_then(|(_, project, _)| stored_session(&value, project))
        });
    let persistent = stored.is_some();
    let mut guard = state.0.lock().map_err(|_| "cloud-lock-error")?;
    if guard.is_none() && persistent {
        *guard = stored.clone();
    }
    Ok(Status {
        user: guard.as_ref().map(|session| session.user.clone()),
        configured: config().is_ok(),
        project_id: config().ok().map(|(_, project, _)| project.into()),
        persistent: stored
            .as_ref()
            .zip(guard.as_ref())
            .is_some_and(|(saved, current)| {
                saved.user.uid == current.user.uid && saved.refresh == current.refresh
            }),
    })
}
#[tauri::command]
pub async fn cloud_sign_in(
    state: tauri::State<'_, Cloud>,
    window: tauri::WebviewWindow,
) -> Result<User, String> {
    main_window(&window)?;
    let cloud = state.inner().clone();
    if AUTH_PENDING.swap(true, Ordering::SeqCst) {
        return Err("oauth-in-progress".into());
    }
    let generation = AUTH_GENERATION.load(Ordering::SeqCst);
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = AuthGuard;
        sign_in(cloud, generation)
    })
    .await
    .map_err(|_| "cloud-worker-error")?
}
#[tauri::command]
pub fn cloud_sign_out(
    state: tauri::State<Cloud>,
    window: tauri::WebviewWindow,
) -> Result<(), String> {
    main_window(&window)?;
    AUTH_GENERATION.fetch_add(1, Ordering::SeqCst);
    let mut guard = state.0.lock().map_err(|_| "cloud-lock-error")?;
    if let Ok(entry) = credential() {
        match entry.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => {}
            Err(_) => return Err("credential-delete-failed".into()),
        }
    }
    *guard = None;
    Ok(())
}
#[tauri::command]
pub async fn cloud_document(
    state: tauri::State<'_, Cloud>,
    window: tauri::WebviewWindow,
    path: String,
) -> Result<Option<Row>, String> {
    main_window(&window)?;
    let cloud = state.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let session = authenticated(&cloud)?;
        document_path(&path, &session.user.uid, false)?;
        let res = client()?
            .get(format!(
                "https://firestore.googleapis.com/v1/{}/{path}",
                base()?
            ))
            .bearer_auth(session.token)
            .send()
            .map_err(|_| "cloud-network-error")?;
        if res.status().as_u16() == 404 {
            return Ok(None);
        }
        row(&response(Ok(res))?).map(Some)
    })
    .await
    .map_err(|_| "cloud-worker-error")?
}
#[tauri::command]
pub async fn cloud_documents(
    state: tauri::State<'_, Cloud>,
    window: tauri::WebviewWindow,
    path: String,
    constraints: Vec<Constraint>,
) -> Result<Vec<Row>, String> {
    main_window(&window)?;
    let cloud = state.inner().clone();
    tauri::async_runtime::spawn_blocking(move || { let session = authenticated(&cloud)?; document_path(&path, &session.user.uid, true)?;
        let (parent, collection) = path.rsplit_once('/').ok_or("cloud-path-forbidden")?;
        let mut query = json!({"from":[{"collectionId":collection}],"limit":1000});
        for constraint in constraints { match constraint.kind.as_str() {
            "limit" => { let count = constraint.value.as_u64().filter(|n| *n > 0 && *n <= 1000).ok_or("cloud-query-forbidden")?; query["limit"] = json!(count); },
            "cursor" => { let cursor = constraint.value.as_str().ok_or("cloud-query-forbidden")?; document_path(cursor, &session.user.uid, false)?; if !cursor.starts_with(&format!("{path}/")) { return Err("cloud-query-forbidden".into()); } query["startAt"] = json!({"values":[{"referenceValue":format!("{}/{cursor}", base()?)}],"before":false}); },
            "order" if constraint.value == "date" || constraint.value == "__name__" => { query["orderBy"] = json!([{"field":{"fieldPath":constraint.value},"direction":if constraint.direction.as_deref() == Some("desc") {"DESCENDING"} else {"ASCENDING"}}]); },
            _ => return Err("cloud-query-forbidden".into()),
        } }
        let result = response(client()?.post(format!("https://firestore.googleapis.com/v1/{}/{parent}:runQuery", base()?)).bearer_auth(session.token).json(&json!({"structuredQuery":query})).send())?;
        result.as_array().ok_or("cloud-invalid-response")?.iter().filter_map(|item|item.get("document")).map(row).collect()
    }).await.map_err(|_| "cloud-worker-error")?
}
#[tauri::command]
pub async fn cloud_commit(
    state: tauri::State<'_, Cloud>,
    window: tauri::WebviewWindow,
    operations: Vec<Operation>,
) -> Result<(), String> {
    main_window(&window)?;
    if operations.len() > 400 {
        return Err("cloud-batch-too-large".into());
    }
    if serde_json::to_vec(&operations.iter().map(|op| &op.data).collect::<Vec<_>>())
        .map_err(|_| "cloud-invalid-document")?
        .len()
        > 8 * 1024 * 1024
    {
        return Err("cloud-batch-too-large".into());
    }
    let cloud = state.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let session = authenticated(&cloud)?;
        let prefix = base()?;
        let mut writes = Vec::new();
        for operation in operations {
            document_path(&operation.path, &session.user.uid, false)?;
            let name = format!("{prefix}/{}", operation.path);
            writes.push(match operation.kind.as_str() {
                "delete" => json!({"delete":name}),
                "set" => {
                    let value = operation.data.ok_or("cloud-invalid-document")?;
                    if !value.is_object()
                        || serde_json::to_vec(&value)
                            .map_err(|_| "cloud-invalid-document")?
                            .len()
                            > 512 * 1024
                    {
                        return Err("cloud-document-too-large".into());
                    }
                    json!({"update":{"name":name,"fields":encode(&value)["mapValue"]["fields"]}})
                }
                _ => return Err("cloud-operation-forbidden".into()),
            });
        }
        if !writes.is_empty() {
            response(
                client()?
                    .post(format!(
                        "https://firestore.googleapis.com/v1/{prefix}:commit"
                    ))
                    .bearer_auth(session.token)
                    .json(&json!({"writes":writes}))
                    .send(),
            )?;
        }
        Ok(())
    })
    .await
    .map_err(|_| "cloud-worker-error")?
}
#[tauri::command]
pub async fn cloud_delete_account(
    state: tauri::State<'_, Cloud>,
    window: tauri::WebviewWindow,
) -> Result<(), String> {
    main_window(&window)?;
    let cloud = state.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let session = authenticated(&cloud)?;
        response(
            client()?
                .post(format!(
                    "https://identitytoolkit.googleapis.com/v1/accounts:delete?key={}",
                    config()?.0
                ))
                .json(&json!({"idToken":session.token}))
                .send(),
        )?;
        if let Ok(entry) = credential() {
            entry
                .delete_credential()
                .map_err(|_| "credential-delete-failed")?;
        }
        *cloud.0.lock().map_err(|_| "cloud-lock-error")? = None;
        Ok(())
    })
    .await
    .map_err(|_| "cloud-worker-error")?
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(target_os = "linux")]
    #[test]
    fn patched_glib_string_iterator_optimized_regression() {
        use glib::variant::ToVariant;
        for _ in 0..10_000 {
            let value = vec!["first", "second", "third"].to_variant();
            let mut iter = value.array_iter_str().unwrap();
            assert_eq!(iter.next(), Some("first"));
            assert_eq!(iter.next_back(), Some("third"));
            assert_eq!(iter.next(), Some("second"));
            assert_eq!(iter.next(), None);
            assert_eq!(value.array_iter_str().unwrap().nth(1), Some("second"));
            assert_eq!(value.array_iter_str().unwrap().nth_back(1), Some("second"));
            assert_eq!(value.array_iter_str().unwrap().last(), Some("third"));
        }
    }
    #[test]
    fn firestore_values_round_trip() {
        let v = json!({"a":[null,true,25,0.5,"hi"],"b":{},"c":[]});
        assert_eq!(decode(&encode(&v)), v);
    }
    #[test]
    fn uid_and_path_scope() {
        assert!(document_path("users/alice/sessions/session-1", "alice", false).is_ok());
        for path in [
            "users/bob/sessions/x",
            "users/alice/admin/x",
            "users/alice/sessions/../x",
            "users/alice/sessions/x?token",
        ] {
            assert!(document_path(path, "alice", false).is_err());
        }
    }
    #[test]
    fn pkce_known_vector() {
        assert_eq!(
            URL_SAFE_NO_PAD.encode(Sha256::digest(
                b"dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
            )),
            "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
        );
    }
    #[test]
    fn stored_credentials_are_scoped_to_the_firebase_project() {
        let value = json!({
            "projectId": "test-project",
            "user": {"uid":"same-uid","email":null,"displayName":null,"photoURL":null},
            "refresh":"test-refresh"
        })
        .to_string();
        assert!(stored_session(&value, "test-project").is_some());
        assert!(stored_session(&value, "production-project").is_none());
    }
    #[test]
    fn legacy_or_incomplete_credentials_require_reconnection() {
        let mut value = json!({
            "user": {"uid":"same-uid","email":null,"displayName":null,"photoURL":null},
            "refresh":"test-refresh"
        });
        assert!(stored_session(&value.to_string(), "test-project").is_none());
        value["projectId"] = json!("test-project");
        value["refresh"] = json!("");
        assert!(stored_session(&value.to_string(), "test-project").is_none());
        value["refresh"] = json!("test-refresh");
        value["user"]["uid"] = json!("");
        assert!(stored_session(&value.to_string(), "test-project").is_none());
    }
}

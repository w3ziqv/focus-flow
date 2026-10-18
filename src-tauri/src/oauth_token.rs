//! Google Desktop clients can require their issued client parameter alongside PKCE.
pub(super) fn form<'a>(
    code: &'a str,
    client: &'a str,
    client_secret: &'a str,
    redirect: &'a str,
    verifier: &'a str,
) -> [(&'static str, &'a str); 6] {
    [
        ("code", code),
        ("client_id", client),
        ("client_secret", client_secret),
        ("redirect_uri", redirect),
        ("grant_type", "authorization_code"),
        ("code_verifier", verifier),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn desktop_exchange_includes_client_parameter_without_dropping_pkce() {
        let params = form(
            "synthetic-code",
            "synthetic-client",
            "synthetic-client-parameter",
            "http://127.0.0.1:12345/callback",
            "synthetic-verifier",
        );
        assert_eq!(params.len(), 6);
        for pair in [
            ("code", "synthetic-code"),
            ("client_id", "synthetic-client"),
            ("client_secret", "synthetic-client-parameter"),
            ("redirect_uri", "http://127.0.0.1:12345/callback"),
            ("grant_type", "authorization_code"),
            ("code_verifier", "synthetic-verifier"),
        ] {
            assert!(params.contains(&pair));
        }
    }
}

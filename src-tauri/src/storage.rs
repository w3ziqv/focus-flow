use atomic_write_file::AtomicWriteFile;
use serde::{Deserialize, Serialize};
use std::{
    collections::BTreeMap,
    fs,
    io::Write,
    path::{Path, PathBuf},
    sync::Mutex,
};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Snapshot {
    pub version: u8,
    pub values: BTreeMap<String, String>,
}
impl Snapshot {
    pub fn validate(&self) -> Result<(), String> {
        if self.version != 3 {
            return Err("Unsupported native data schema".into());
        }
        for (key, value) in &self.values {
            if !(key.starts_with("ff_") || key.starts_with("ff2_") || key.starts_with("ff3_"))
                || value.len() > 8 * 1024 * 1024
            {
                return Err("Invalid native data entry".into());
            }
        }
        Ok(())
    }
}

pub struct DataStore {
    pub path: PathBuf,
    pub lock: Mutex<()>,
}
impl DataStore {
    pub fn load(&self) -> Result<Option<Snapshot>, String> {
        let _guard = self.lock.lock().map_err(|e| e.to_string())?;
        if !self.path.exists() {
            return Ok(None);
        }
        read_snapshot(&self.path).map(Some)
    }
    pub fn save(&self, snapshot: &Snapshot) -> Result<(), String> {
        snapshot.validate()?;
        let bytes = serde_json::to_vec(snapshot).map_err(|e| e.to_string())?;
        if bytes.len() > 16 * 1024 * 1024 {
            return Err("Native data file too large".into());
        }
        let _guard = self.lock.lock().map_err(|e| e.to_string())?;
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        // Never replace a corrupted source with defaults. Keep the last good file.
        if self.path.exists() {
            let old = read_snapshot(&self.path)?;
            atomic_write(
                &self.path.with_extension("json.bak"),
                &serde_json::to_vec(&old).map_err(|e| e.to_string())?,
            )?;
        }
        atomic_write(&self.path, &bytes)
    }
    pub fn restore(&self) -> Result<(), String> {
        let _guard = self.lock.lock().map_err(|e| e.to_string())?;
        let snapshot = read_snapshot(&self.path.with_extension("json.bak"))?;
        // Preserve the damaged source for manual recovery.
        if self.path.exists() {
            if fs::metadata(&self.path).map_err(|e| e.to_string())?.len() > 16 * 1024 * 1024 {
                return Err("Damaged data file too large to preserve safely".into());
            }
            atomic_write(
                &self.path.with_extension("json.corrupt"),
                &fs::read(&self.path).map_err(|e| e.to_string())?,
            )?;
        }
        atomic_write(
            &self.path,
            &serde_json::to_vec(&snapshot).map_err(|e| e.to_string())?,
        )
    }
}
fn read_snapshot(path: &Path) -> Result<Snapshot, String> {
    let size = fs::metadata(path).map_err(|e| e.to_string())?.len();
    if size > 16 * 1024 * 1024 {
        return Err("Native data file too large".into());
    }
    let snapshot: Snapshot = serde_json::from_slice(&fs::read(path).map_err(|e| e.to_string())?)
        .map_err(|e| format!("Cannot read {}: {}", path.display(), e))?;
    snapshot.validate()?;
    Ok(snapshot)
}
fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let mut file = AtomicWriteFile::open(path).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        file.as_file()
            .set_permissions(fs::Permissions::from_mode(0o600))
            .map_err(|e| e.to_string())?;
    }
    file.write_all(bytes).map_err(|e| e.to_string())?;
    file.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn store() -> DataStore {
        let dir = std::env::temp_dir().join(format!(
            "focus-flow-test-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        DataStore {
            path: dir.join("data.json"),
            lock: Mutex::new(()),
        }
    }
    #[test]
    fn durable_replacement_and_recovery() {
        let store = store();
        let first = Snapshot {
            version: 3,
            values: BTreeMap::from([("ff2_theme".into(), "\"sage\"".into())]),
        };
        store.save(&first).unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            assert_eq!(
                fs::metadata(&store.path).unwrap().permissions().mode() & 0o777,
                0o600
            );
        }
        let second = Snapshot {
            version: 3,
            values: BTreeMap::from([("ff2_theme".into(), "\"dark\"".into())]),
        };
        store.save(&second).unwrap();
        assert_eq!(
            store.load().unwrap().unwrap().values["ff2_theme"],
            "\"dark\""
        );
        fs::write(&store.path, "broken").unwrap();
        assert!(store.save(&second).is_err());
        assert_eq!(fs::read_to_string(&store.path).unwrap(), "broken");
        store.restore().unwrap();
        assert_eq!(
            store.load().unwrap().unwrap().values["ff2_theme"],
            "\"sage\""
        );
        assert_eq!(
            fs::read_to_string(store.path.with_extension("json.corrupt")).unwrap(),
            "broken"
        );
        fs::remove_dir_all(store.path.parent().unwrap()).unwrap();
    }
    #[test]
    fn rejects_unknown_schema_and_unrelated_keys() {
        assert!(Snapshot {
            version: 4,
            values: BTreeMap::new()
        }
        .validate()
        .is_err());
        assert!(Snapshot {
            version: 3,
            values: BTreeMap::from([("../secret".into(), "x".into())])
        }
        .validate()
        .is_err());
    }
}

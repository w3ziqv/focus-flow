//! The webview passes a catalog ID, never an arbitrary URL or shell argument.
const SOURCES: &str = include_str!("../../src/lib/guides/sources.json");
pub fn source_url(id: &str) -> Option<String> {
    let sources: serde_json::Value = serde_json::from_str(SOURCES).ok()?;
    let url = sources.get(id)?.get("url")?.as_str()?;
    url.starts_with("https://").then(|| url.to_owned())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn only_accepts_compiled_catalog_ids() {
        assert_eq!(
            source_url("retrieval").as_deref(),
            Some("https://pubmed.ncbi.nlm.nih.gov/16507066/")
        );
        for id in [
            "",
            "constructor",
            "__proto__",
            "https://example.com",
            "file:///tmp/a",
            "../rest",
            "rest; echo no",
        ] {
            assert!(source_url(id).is_none());
        }
    }
    #[test]
    fn every_catalog_entry_has_a_fixed_https_destination() {
        let sources: serde_json::Value = serde_json::from_str(SOURCES).unwrap();
        for (id, entry) in sources.as_object().unwrap() {
            assert_eq!(source_url(id).as_deref(), entry["url"].as_str());
        }
    }
}

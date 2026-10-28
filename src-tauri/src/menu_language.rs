//! Native-only startup/menu copy. Keep in sync with the four application locales.
//! This is available before the webview and its translation provider have loaded.
pub fn stored_language(raw: Option<&str>) -> String {
    let value =
        raw.map(|text| serde_json::from_str::<String>(text).unwrap_or_else(|_| text.to_owned()));
    match value.as_deref() {
        Some(lang @ ("pl" | "en" | "es" | "zh")) => lang.to_owned(),
        _ => "en".into(),
    }
}
pub fn label(lang: &str, action: &str) -> &'static str {
    let labels = match lang {
        "pl" => [
            "Start / Pauza",
            "Pomiń fazę",
            "Resetuj",
            "Pokaż Focus Flow",
            "Mały timer",
            "Ustawienia",
            "Zakończ",
        ],
        "es" => [
            "Iniciar / Pausar",
            "Saltar fase",
            "Reiniciar",
            "Mostrar Focus Flow",
            "Temporizador flotante",
            "Ajustes",
            "Salir",
        ],
        "zh" => [
            "开始 / 暂停",
            "跳过阶段",
            "重置",
            "显示 Focus Flow",
            "悬浮计时器",
            "设置",
            "退出",
        ],
        _ => [
            "Start / Pause",
            "Skip phase",
            "Reset",
            "Show Focus Flow",
            "Floating timer",
            "Preferences",
            "Quit",
        ],
    };
    let index = match action {
        "toggle" => 0,
        "skip" => 1,
        "reset" => 2,
        "show" => 3,
        "mini" => 4,
        "preferences" => 5,
        _ => 6,
    };
    labels[index]
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn accepts_current_and_legacy_language_preferences() {
        for lang in ["pl", "en", "es", "zh"] {
            assert_eq!(stored_language(Some(&format!("\"{lang}\""))), lang);
            assert_eq!(stored_language(Some(lang)), lang);
            for action in [
                "toggle",
                "skip",
                "reset",
                "show",
                "mini",
                "preferences",
                "quit",
            ] {
                assert!(!label(lang, action).is_empty());
                if lang != "en" {
                    assert_ne!(label(lang, action), label("en", action));
                }
            }
        }
        assert_eq!(stored_language(None), "en");
        assert_eq!(stored_language(Some("{\"lang\":\"zh\"}")), "en");
    }
    #[test]
    fn localizes_menu_actions_before_the_frontend_starts() {
        assert_eq!(label("es", "quit"), "Salir");
        assert_eq!(label("zh", "skip"), "跳过阶段");
        assert_eq!(label("unknown", "preferences"), "Preferences");
    }
}

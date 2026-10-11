fn main() {
    for name in [
        "VITE_FIREBASE_API_KEY",
        "VITE_FIREBASE_PROJECT_ID",
        "FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID",
    ] {
        println!("cargo:rerun-if-env-changed={name}");
    }
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "set_awake",
            "cloud_status",
            "cloud_sign_in",
            "cloud_sign_out",
            "cloud_document",
            "cloud_documents",
            "cloud_commit",
            "cloud_delete_account",
            "discovery_start",
            "discovery_stop",
            "desktop_action",
            "finish_exit",
            "load_data",
            "save_data",
            "restore_data",
            "desktop_warnings",
            "timer_display",
            "publish_timer",
            "toggle_mini",
        ]),
    ))
    .expect("Could not build application permissions");
}

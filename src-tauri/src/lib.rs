mod cloud;
mod discovery;
mod storage;
mod tray_dial;

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use storage::{DataStore, Snapshot};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimerDisplay {
    mode: String,
    mode_label: String,
    remaining_ms: f64,
    total_ms: f64,
    running: bool,
    task: String,
    theme: String,
    lang: String,
    toggle_label: String,
    reset_label: String,
    show_label: String,
    close_label: String,
}
#[derive(Default)]
pub struct DesktopState {
    mini_lock: Mutex<()>,
    timer: Mutex<Option<TimerDisplay>>,
    icon_key: Mutex<String>,
    warnings: Mutex<Vec<String>>,
    menu_items: Mutex<Vec<MenuItem<tauri::Wry>>>,
    menu_key: Mutex<String>,
}

struct AwakeSender(std::sync::mpsc::Sender<bool>);
#[tauri::command]
fn set_awake(
    state: tauri::State<AwakeSender>,
    active: bool,
    window: tauri::WebviewWindow,
) -> Result<(), String> {
    if window.label() != "main" {
        return Err("Only main window controls wake lock".into());
    }
    state.0.send(active).map_err(|e| e.to_string())
}
#[tauri::command]
fn discovery_start(
    app: tauri::AppHandle,
    state: tauri::State<discovery::Discovery>,
    device: String,
    name: String,
    window: tauri::WebviewWindow,
) -> Result<(), String> {
    if window.label() != "main" {
        return Err("Only main window controls pairing".into());
    }
    state.start(app, device, name)
}
#[tauri::command]
fn discovery_stop(
    state: tauri::State<discovery::Discovery>,
    window: tauri::WebviewWindow,
) -> Result<(), String> {
    if window.label() != "main" {
        return Err("Only main window controls pairing".into());
    }
    state.stop();
    Ok(())
}
fn show_main(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}
fn action(app: &tauri::AppHandle, name: &str) {
    if name == "show" {
        show_main(app);
        return;
    }
    if name == "mini" {
        let handle = app.clone();
        tauri::async_runtime::spawn_blocking(move || {
            if let Err(error) = toggle_mini_window(handle.clone()) {
                let _ = handle.emit_to("main", "desktop-error", format!("Floating timer: {error}"));
            }
        });
        return;
    }
    if name == "preferences" || name == "quit" {
        show_main(app);
    }
    let _ = app.emit_to("main", "desktop-action", name);
}
#[tauri::command]
fn desktop_action(
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
    name: String,
) -> Result<(), String> {
    if ![
        "toggle",
        "reset",
        "skip",
        "show",
        "mini",
        "preferences",
        "quit",
    ]
    .contains(&name.as_str())
    {
        return Err("Unknown desktop action".into());
    }
    if window.label() != "main"
        && !(window.label() == "mini" && ["show", "toggle"].contains(&name.as_str()))
    {
        return Err("Action forbidden for this window".into());
    }
    action(&app, &name);
    Ok(())
}
#[tauri::command]
fn finish_exit(app: tauri::AppHandle, window: tauri::WebviewWindow) -> Result<(), String> {
    if window.label() != "main" {
        return Err("Only main window may finish saving and exit".into());
    }
    app.exit(0);
    Ok(())
}
#[tauri::command]
fn load_data(
    store: tauri::State<DataStore>,
    window: tauri::WebviewWindow,
) -> Result<Option<Snapshot>, String> {
    if window.label() != "main" {
        return Err("Data is private to main window".into());
    }
    store.load()
}
#[tauri::command]
fn save_data(
    store: tauri::State<DataStore>,
    snapshot: Snapshot,
    window: tauri::WebviewWindow,
) -> Result<(), String> {
    if window.label() != "main" {
        return Err("Only main window may write data".into());
    }
    store.save(&snapshot)
}
#[tauri::command]
fn restore_data(
    store: tauri::State<DataStore>,
    window: tauri::WebviewWindow,
) -> Result<(), String> {
    if window.label() != "main" {
        return Err("Only main window may restore data".into());
    }
    store.restore()
}
#[tauri::command]
fn desktop_warnings(state: tauri::State<DesktopState>) -> Vec<String> {
    state.warnings.lock().unwrap().clone()
}
#[tauri::command]
fn timer_display(state: tauri::State<DesktopState>) -> Option<TimerDisplay> {
    state.timer.lock().unwrap().clone()
}
#[tauri::command]
fn publish_timer(
    app: tauri::AppHandle,
    state: tauri::State<DesktopState>,
    mut timer: TimerDisplay,
    window: tauri::WebviewWindow,
) -> Result<(), String> {
    if window.label() != "main" {
        return Err("Only main window owns timer".into());
    }
    if !["focus", "short", "long"].contains(&timer.mode.as_str())
        || !timer.remaining_ms.is_finite()
        || !timer.total_ms.is_finite()
        || timer.total_ms <= 0.0
    {
        return Err("Invalid timer display".into());
    }
    timer.task = timer.task.chars().take(200).collect();
    let minutes = (timer.remaining_ms.max(0.0) / 60_000.0).ceil() as u32;
    let key = format!("{}:{}:{}", timer.mode, minutes, timer.running);
    if let Some(tray) = app.tray_by_id("timer") {
        let seconds = (timer.remaining_ms.max(0.0) / 1000.0).ceil() as u32;
        let _ = tray.set_tooltip(Some(format!(
            "{} • {:02}:{:02} • {}",
            timer.mode_label,
            seconds / 60,
            seconds % 60,
            timer.task
        )));
        let mut last = state.icon_key.lock().unwrap();
        if *last != key {
            let size = if cfg!(target_os = "macos") {
                44
            } else if cfg!(target_os = "windows") {
                32
            } else {
                22
            };
            let bytes = tray_dial::render(
                minutes,
                1.0 - timer.remaining_ms / timer.total_ms,
                timer.running,
                timer.mode == "focus",
                size,
            )?;
            tray.set_icon(Some(tauri::image::Image::new_owned(bytes, size, size)))
                .map_err(|e| e.to_string())?;
            *last = key;
        }
    }
    let menu_key = format!("{}:{}", timer.lang, timer.running);
    let mut previous_menu = state.menu_key.lock().unwrap();
    if *previous_menu != menu_key {
        let pl = timer.lang == "pl";
        for item in state.menu_items.lock().unwrap().iter() {
            let label = match item.id().as_ref() {
                "toggle" => &timer.toggle_label,
                "reset" => &timer.reset_label,
                "show" => &timer.show_label,
                "skip" => {
                    if pl {
                        "Pomiń fazę"
                    } else {
                        "Skip phase"
                    }
                }
                "mini" => {
                    if pl {
                        "Mały timer"
                    } else {
                        "Floating timer"
                    }
                }
                "preferences" => {
                    if pl {
                        "Ustawienia"
                    } else {
                        "Preferences"
                    }
                }
                _ => {
                    if pl {
                        "Zakończ"
                    } else {
                        "Quit"
                    }
                }
            };
            item.set_text(label).map_err(|e| e.to_string())?;
        }
        *previous_menu = menu_key;
    }
    *state.timer.lock().unwrap() = Some(timer.clone());
    app.emit_to("mini", "timer-display", &timer)
        .map_err(|e| e.to_string())?;
    Ok(())
}
#[tauri::command]
async fn toggle_mini(app: tauri::AppHandle, window: tauri::WebviewWindow) -> Result<(), String> {
    if window.label() != "main" {
        return Err("Only main window controls the floating timer".into());
    }
    tauri::async_runtime::spawn_blocking(move || toggle_mini_window(app))
        .await
        .map_err(|e| e.to_string())?
}

fn toggle_mini_window(app: tauri::AppHandle) -> Result<(), String> {
    // WebView2 window creation must not block a synchronous command or UI event.
    // Serialize concurrent shortcut/tray/command requests before checking the ID.
    let state = app.state::<DesktopState>();
    let _lock = state.mini_lock.lock().map_err(|e| e.to_string())?;
    if let Some(window) = app.get_webview_window("mini") {
        if window.is_visible().map_err(|e| e.to_string())? {
            window.hide().map_err(|e| e.to_string())?;
        } else {
            window.show().map_err(|e| e.to_string())?;
        }
    } else {
        WebviewWindowBuilder::new(&app, "mini", WebviewUrl::App("index.html?mini=1".into()))
            .title("Focus Flow")
            .inner_size(220.0, 80.0)
            .resizable(false)
            .decorations(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .transparent(true)
            .build()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
fn setup_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let toggle = MenuItem::with_id(app, "toggle", "Start / Pause", true, None::<&str>)?;
    let skip = MenuItem::with_id(app, "skip", "Skip phase", true, None::<&str>)?;
    let reset = MenuItem::with_id(app, "reset", "Reset", true, None::<&str>)?;
    let show = MenuItem::with_id(app, "show", "Show Focus Flow", true, None::<&str>)?;
    let mini = MenuItem::with_id(app, "mini", "Floating timer", true, None::<&str>)?;
    let prefs = MenuItem::with_id(app, "preferences", "Preferences", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&toggle, &skip, &reset, &show, &mini, &prefs, &quit])?;
    *app.state::<DesktopState>().menu_items.lock().unwrap() =
        vec![toggle, skip, reset, show, mini, prefs, quit];
    let icon = tauri::image::Image::new_owned(
        tray_dial::render(25, 0.0, false, true, 44).unwrap(),
        44,
        44,
    );
    TrayIconBuilder::with_id("timer")
        .icon(icon)
        .tooltip("Focus Flow")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| action(app, event.id.as_ref()))
        .on_tray_icon_event(|tray, event| {
            if matches!(
                event,
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                }
            ) {
                action(tray.app_handle(), "toggle");
            }
        })
        .build(app)?;
    Ok(())
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let modifier = if cfg!(target_os = "macos") {
        Modifiers::SUPER | Modifiers::ALT
    } else {
        Modifiers::CONTROL | Modifiers::ALT
    };
    tauri::Builder::default()
        .manage(cloud::Cloud::default())
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            show_main(app)
        }))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }
                    let name = if shortcut.matches(modifier, Code::Space) {
                        "toggle"
                    } else if shortcut.matches(modifier, Code::KeyR) {
                        "reset"
                    } else {
                        "mini"
                    };
                    action(app, name);
                })
                .build(),
        )
        .manage(DesktopState::default())
        .manage(discovery::Discovery::default())
        .setup(move |app| {
            #[cfg(target_os = "linux")]
            if let Some(window) = app.get_webview_window("main") {
                window.with_webview(|webview| {
                    use webkit2gtk::{SettingsExt, WebViewExt};
                    if let Some(settings) = webview.inner().settings() {
                        settings.set_enable_media_stream(true);
                        settings.set_enable_webrtc(true);
                    }
                })?;
            }
            let (sender, receiver) = std::sync::mpsc::channel::<bool>();
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                let mut guard = None;
                while let Ok(active) = receiver.recv() {
                    if active && guard.is_none() {
                        match keepawake::Builder::default()
                            .display(true)
                            .idle(true)
                            .reason("Focus session")
                            .app_name("Focus Flow")
                            .app_reverse_domain("ink.focusflow.desktop")
                            .create()
                        {
                            Ok(lock) => guard = Some(lock),
                            Err(e) => {
                                let _ = handle.emit_to(
                                    "main",
                                    "desktop-error",
                                    format!("Wake lock: {e}"),
                                );
                            }
                        }
                    } else if !active {
                        guard = None;
                    }
                }
            });
            app.manage(AwakeSender(sender));
            app.manage(DataStore {
                path: app.path().app_data_dir()?.join("data.json"),
                lock: Mutex::new(()),
            });
            if let Err(e) = setup_tray(app.handle()) {
                app.state::<DesktopState>()
                    .warnings
                    .lock()
                    .unwrap()
                    .push(format!("Tray: {e}"));
            }
            for code in [Code::Space, Code::KeyR, Code::KeyF] {
                if let Err(e) = app
                    .global_shortcut()
                    .register(Shortcut::new(Some(modifier), code))
                {
                    app.state::<DesktopState>()
                        .warnings
                        .lock()
                        .unwrap()
                        .push(format!("Shortcut {code:?}: {e}"));
                }
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                if window.label() == "main" && window.app_handle().tray_by_id("timer").is_none() {
                    action(window.app_handle(), "quit");
                } else {
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            cloud::cloud_status,
            cloud::cloud_sign_in,
            cloud::cloud_sign_out,
            cloud::cloud_document,
            cloud::cloud_documents,
            cloud::cloud_commit,
            cloud::cloud_delete_account,
            load_data,
            save_data,
            restore_data,
            desktop_action,
            finish_exit,
            publish_timer,
            timer_display,
            toggle_mini,
            desktop_warnings,
            set_awake,
            discovery_start,
            discovery_stop
        ])
        .run(tauri::generate_context!())
        .expect("error while running Focus Flow");
}

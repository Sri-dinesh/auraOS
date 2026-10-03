pub mod app_id;
pub mod commands;
pub mod context;
pub mod error;
pub mod platform;
pub mod rules;
pub mod scenes;
pub mod state;
pub mod tray;

use state::AppState;
use std::sync::Arc;
use tauri::{Emitter, Manager};

/// Event name the frontend listens on for context updates (plan section 10).
pub const CONTEXT_EVENT: &str = "context://changed";

/// Event name emitted when the active scene changes.
pub const SCENE_EVENT: &str = "scene://changed";

/// How often the context engine samples the OS.
///
/// 1Hz keeps idle CPU well under the <1% target in plan section 60 while
/// staying responsive enough for app-switch transitions.
const CONTEXT_POLL_MS: u64 = 1_000;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_tracing();

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            // A second launch focuses the existing window instead of starting
            // a duplicate instance.
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            app.manage(AppState::new());

            // The window is the primary surface, so a tray or shortcut failure
            // must not abort startup. Release builds set
            // `windows_subsystem = "windows"`, so returning Err here would kill
            // the process with no console and no explanation.
            if let Err(err) = tray::build_tray(app.handle()) {
                tracing::warn!("tray unavailable: {err}");
            }
            if let Err(err) = register_shortcut(app.handle()) {
                tracing::warn!("global shortcut unavailable: {err}");
            }

            spawn_context_watcher(app.handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_context,
            commands::set_active_scene,
            commands::get_active_scene,
            commands::tray_update,
            commands::set_quitting,
        ])
        .on_window_event(|window, event| {
            // Closing the window hides to tray instead of quitting, unless the
            // user explicitly chose Quit from the tray menu (plan section 17).
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let state = window.state::<AppState>();
                if !state.is_quitting() {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running AuraOS");
}

/// Initialises `tracing`.
///
/// Without this the `tracing` crate discards every event, so startup problems
/// are invisible. Output goes to stderr; release builds have no console, but
/// `auraos.exe > auraos.log 2>&1` still captures it because the GUI subsystem
/// inherits redirected handles. Set `AURAOS_LOG=debug` for detail.
fn init_tracing() {
    use tracing_subscriber::{fmt, EnvFilter};

    let filter = EnvFilter::try_from_env("AURAOS_LOG")
        .unwrap_or_else(|_| EnvFilter::new("auraos=info,warn"));

    let _ = fmt()
        .with_env_filter(filter)
        .with_ansi(false)
        .with_target(true)
        .with_writer(std::io::stderr)
        .try_init();
}

/// Registers the global Quick Switcher shortcut (plan section 16).
fn register_shortcut(app: &tauri::AppHandle) -> crate::error::Result<()> {
    use tauri_plugin_global_shortcut::{
        Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
    };

    let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);

    app.global_shortcut()
        .on_shortcut(shortcut, move |app, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = app.emit("auraos://quick-switcher", ());
                }
            }
        })
        .map_err(|e| crate::error::AuraError::Store(e.to_string()))?;

    app.global_shortcut()
        .register(shortcut)
        .map_err(|e| crate::error::AuraError::Store(e.to_string()))?;

    Ok(())
}

/// Polls the platform adapters and emits `context://changed` on change.
fn spawn_context_watcher(app: tauri::AppHandle) {
    std::thread::spawn(move || {
        let platform = platform::Platform::detect();
        let mut last_serialized: Option<String> = None;

        loop {
            let desktop = context::engine::snapshot(
                &platform,
                context::engine::now_ms(),
                context::engine::local_hour(),
            );

            // Only emit when something actually changed, so the frontend and
            // the rules engine are not woken on every tick.
            let serialized = serde_json::to_string(&desktop).unwrap_or_default();
            if Some(&serialized) != last_serialized.as_ref() {
                last_serialized = Some(serialized.clone());
                let _ = app.emit(CONTEXT_EVENT, &desktop);
            }

            std::thread::sleep(std::time::Duration::from_millis(CONTEXT_POLL_MS));
        }
    });
}

/// Shared handle type used by commands.
pub type SharedState = Arc<AppState>;

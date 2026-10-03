use crate::error::{AuraError, Result};
use serde::Serialize;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, Runtime};

/// State the tray menu renders, stored so menu items can be rebuilt.
#[derive(Debug, Clone, Serialize)]
pub struct TrayState {
    pub scene_name: String,
    pub automation_paused: bool,
}

/// Builds the tray icon and its menu (plan section 17).
pub fn build_tray<R: Runtime>(app: &AppHandle<R>) -> Result<()> {
    let show = MenuItem::with_id(app, "show", "Open AuraOS", true, None::<&str>)?;
    let scene_label =
        MenuItem::with_id(app, "current_scene", "No active scene", false, None::<&str>)?;
    let pause = MenuItem::with_id(app, "pause", "Pause Automation", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[&scene_label, &separator, &show, &settings, &pause, &quit],
    )
    .map_err(|e| AuraError::Store(format!("tray menu: {e}")))?;

    TrayIconBuilder::with_id("auraos-tray")
        .icon(
            app.default_window_icon()
                .cloned()
                .ok_or(AuraError::Store("missing application icon".into()))?,
        )
        .tooltip("AuraOS")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "show" => focus_main_window(app),
            "settings" => {
                focus_main_window(app);
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("auraos://navigate", "/settings");
                }
            }
            "pause" => {
                if let Some(state) = app.try_state::<crate::state::AppState>() {
                    state.set_manual_override(None);
                }
                let _ = app.emit("auraos://toggle-automation", ());
            }
            "quit" => {
                if let Some(state) = app.try_state::<crate::state::AppState>() {
                    state.set_quitting(true);
                }
                app.exit(0);
            }
            _ => {}
        })
        .build(app)
        .map_err(|e| AuraError::Store(format!("tray icon: {e}")))?;

    Ok(())
}

/// Rebuilds the tray menu to reflect the current scene and automation state.
pub fn update<R: Runtime>(app: &AppHandle<R>, scene_name: &str, paused: bool) -> Result<()> {
    let Some(tray) = app.tray_by_id("auraos-tray") else {
        return Ok(());
    };

    let scene_label = MenuItem::with_id(
        app,
        "current_scene",
        if scene_name.is_empty() {
            "No active scene"
        } else {
            scene_name
        },
        false,
        None::<&str>,
    )?;
    let pause_label = MenuItem::with_id(
        app,
        "pause",
        if paused {
            "Resume Automation"
        } else {
            "Pause Automation"
        },
        true,
        None::<&str>,
    )?;
    let show = MenuItem::with_id(app, "show", "Open AuraOS", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;

    let menu = Menu::with_items(
        app,
        &[
            &scene_label,
            &separator,
            &show,
            &settings,
            &pause_label,
            &quit,
        ],
    )
    .map_err(|e| AuraError::Store(format!("tray menu: {e}")))?;

    tray.set_menu(Some(menu))
        .map_err(|e| AuraError::Store(format!("set tray menu: {e}")))?;
    tray.set_tooltip(Some(format!("AuraOS · {scene_name}")))
        .map_err(|e| AuraError::Store(format!("set tray tooltip: {e}")))?;

    Ok(())
}

fn focus_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

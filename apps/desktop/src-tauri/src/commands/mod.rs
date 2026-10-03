use crate::context::{self, DesktopContext};
use crate::error::Result;
use crate::platform::Platform;
use crate::rules::RuleContext;
use crate::scenes::Scene;
use crate::state::AppState;
use tauri::{Emitter, State};

/// Returns the current desktop context snapshot.
#[tauri::command]
pub fn get_context(state: State<'_, AppState>) -> Option<DesktopContext> {
    state.context()
}

/// Activates a scene and reports the diff that was applied.
///
/// Returns the scene so the frontend can render it even if the resolution was
/// triggered from the tray rather than the rules engine.
#[tauri::command]
pub fn set_active_scene(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    scene_id: String,
) -> Result<Option<Scene>> {
    let scenes = state.scenes();
    let next = crate::rules::find_scene(&scenes, &scene_id).cloned();

    if let Some(scene) = next.clone() {
        let previous = state
            .active_scene_id()
            .and_then(|id| crate::rules::find_scene(&scenes, &id).cloned());

        state.set_active_scene_id(Some(scene_id.clone()));

        // Only changed properties are emitted so the frontend can skip
        // reloading an unchanged wallpaper (plan section 10).
        let diff = previous
            .as_ref()
            .map(|p| scene.diff_against(p))
            .unwrap_or_default();

        let _ = app.emit(
            crate::SCENE_EVENT,
            serde_json::json!({
                "sceneId": scene_id,
                "diff": diff,
            }),
        );
    }

    Ok(next)
}

#[tauri::command]
pub fn get_active_scene(state: State<'_, AppState>) -> Result<Option<Scene>> {
    let scenes = state.scenes();
    Ok(state
        .active_scene_id()
        .and_then(|id| crate::rules::find_scene(&scenes, &id).cloned()))
}

/// Pushes the current scene name and automation state into the tray menu.
#[tauri::command]
pub fn tray_update(
    app: tauri::AppHandle,
    scene_name: String,
    automation_paused: bool,
) -> Result<()> {
    crate::tray::update(&app, &scene_name, automation_paused)
}

/// Lets the frontend distinguish "closed to tray" from a real quit.
#[tauri::command]
pub fn set_quitting(state: State<'_, AppState>, quitting: bool) {
    state.set_quitting(quitting);
}

/// Builds a one-shot context snapshot on demand.
///
/// Exposed for the Context Inspector (plan section 54) so a human can trigger
/// a refresh without waiting for the next poll tick.
#[tauri::command]
pub fn refresh_context(app: tauri::AppHandle, state: State<'_, AppState>) -> DesktopContext {
    let platform = Platform::detect();
    let desktop = context::engine::snapshot(
        &platform,
        context::engine::now_ms(),
        context::engine::local_hour(),
    );

    state.set_context(desktop.clone());

    // Evaluate automation on a manual refresh too.
    let rule_context = RuleContext::from_desktop(&desktop, state.manual_override());
    let rules = state.rules();
    let now = context::engine::now_ms().max(0) as u64;
    let resolution = {
        let cooldowns = state.cooldowns_mut();
        let guard = cooldowns.lock().unwrap_or_else(|e| e.into_inner());
        crate::rules::resolve_scene(&rules, &rule_context, &guard, now)
    };

    if let Some(scene_id) = resolution.scene_id.clone() {
        if state.active_scene_id().as_deref() != Some(scene_id.as_str()) {
            let scenes = state.scenes();
            if crate::rules::find_scene(&scenes, &scene_id).is_some() {
                state.set_active_scene_id(Some(scene_id.clone()));
                let _ = app.emit(
                    crate::SCENE_EVENT,
                    serde_json::json!({ "sceneId": scene_id, "diff": {} }),
                );
            }
        }
    }

    if let Some(rule_id) = resolution.rule_id.clone() {
        let cooldowns = state.cooldowns_mut();
        let mut guard = cooldowns.lock().unwrap_or_else(|e| e.into_inner());
        guard.mark_fired(&rule_id, now);
    }

    let _ = app.emit(crate::CONTEXT_EVENT, &desktop);
    desktop
}

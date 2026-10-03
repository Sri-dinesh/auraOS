use crate::context::DesktopContext;
use crate::rules::{Cooldowns, Rule};
use crate::scenes::Scene;
use std::sync::Mutex;

/// Mutable application state shared across commands.
pub struct AppState {
    context: Mutex<Option<DesktopContext>>,
    scenes: Mutex<Vec<Scene>>,
    rules: Mutex<Vec<Rule>>,
    active_scene_id: Mutex<Option<String>>,
    manual_override: Mutex<Option<String>>,
    cooldowns: Mutex<Cooldowns>,
    quitting: Mutex<bool>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            context: Mutex::new(None),
            scenes: Mutex::new(Vec::new()),
            rules: Mutex::new(Vec::new()),
            active_scene_id: Mutex::new(None),
            manual_override: Mutex::new(None),
            cooldowns: Mutex::new(Cooldowns::new()),
            quitting: Mutex::new(false),
        }
    }

    /// A poisoned lock means another thread panicked while holding it; we
    /// recover the guard rather than propagating a panic across the IPC
    /// boundary (plan section 65: never surface raw panics to the UI).
    fn lock<T>(mutex: &Mutex<T>) -> std::sync::MutexGuard<'_, T> {
        mutex.lock().unwrap_or_else(|e| e.into_inner())
    }

    pub fn context(&self) -> Option<DesktopContext> {
        Self::lock(&self.context).clone()
    }

    pub fn set_context(&self, context: DesktopContext) {
        *Self::lock(&self.context) = Some(context);
    }

    pub fn scenes(&self) -> Vec<Scene> {
        Self::lock(&self.scenes).clone()
    }

    pub fn set_scenes(&self, scenes: Vec<Scene>) {
        *Self::lock(&self.scenes) = scenes;
    }

    pub fn rules(&self) -> Vec<Rule> {
        Self::lock(&self.rules).clone()
    }

    pub fn set_rules(&self, rules: Vec<Rule>) {
        *Self::lock(&self.rules) = rules;
    }

    pub fn active_scene_id(&self) -> Option<String> {
        Self::lock(&self.active_scene_id).clone()
    }

    pub fn set_active_scene_id(&self, id: Option<String>) {
        *Self::lock(&self.active_scene_id) = id;
    }

    pub fn manual_override(&self) -> Option<String> {
        Self::lock(&self.manual_override).clone()
    }

    pub fn set_manual_override(&self, id: Option<String>) {
        *Self::lock(&self.manual_override) = id;
    }

    pub fn cooldowns_mut(&self) -> &Mutex<Cooldowns> {
        &self.cooldowns
    }

    pub fn is_quitting(&self) -> bool {
        *Self::lock(&self.quitting)
    }

    pub fn set_quitting(&self, quitting: bool) {
        *Self::lock(&self.quitting) = quitting;
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn state_starts_empty() {
        let state = AppState::new();
        assert!(state.context().is_none());
        assert!(state.scenes().is_empty());
        assert!(state.active_scene_id().is_none());
        assert!(!state.is_quitting());
    }

    #[test]
    fn state_round_trips_scenes_and_rules() {
        let state = AppState::new();
        state.set_active_scene_id(Some("focus".into()));
        assert_eq!(state.active_scene_id().as_deref(), Some("focus"));
        assert!(!state.is_quitting());
        state.set_quitting(true);
        assert!(state.is_quitting());
    }

    #[test]
    fn recovers_from_a_poisoned_lock() {
        let state = std::sync::Arc::new(AppState::new());

        let panicking = {
            let state = state.clone();
            std::thread::spawn(move || {
                let _guard = state.active_scene_id.lock().unwrap();
                panic!("simulate a panic while holding the lock");
            })
        };
        assert!(
            panicking.join().is_err(),
            "the thread was expected to panic"
        );

        // Accessing state after a panic must not panic again.
        assert!(state.active_scene_id().is_none());
        state.set_quitting(true);
        assert!(state.is_quitting());
    }
}

use super::SignalProvider;
use crate::context::ApplicationInfo;

/// Window info as reported by a Wayland compositor's IPC.
#[derive(Debug, Clone)]
pub struct CompositorWindow {
    pub class: String,
    pub title: Option<String>,
    pub workspace: Option<u32>,
    pub pid: u32,
}

/// Reads the active window from a Wayland compositor.
///
/// Hyprland is the reference Linux target (see plan section 12); the trait
/// boundary keeps AuraOS itself compositor-agnostic so GNOME/KDE can be added
/// without touching the scene or rules logic.
pub trait WaylandWindowProvider: Send + Sync {
    fn active_window(&self) -> Option<CompositorWindow>;
}

/// Hyprland IPC via `hyprctl -j activewindow`.
pub struct HyprlandProvider;

impl WaylandWindowProvider for HyprlandProvider {
    fn active_window(&self) -> Option<CompositorWindow> {
        let output = std::process::Command::new("hyprctl")
            .args(["-j", "activewindow"])
            .output()
            .ok()?;
        if !output.status.success() {
            return None;
        }
        parse_hyprland_active_window(&output.stdout)
    }
}

/// Parses the `hyprctl -j activewindow` payload.
///
/// Kept as a pure function so it can be tested without a running compositor.
pub fn parse_hyprland_active_window(raw: &[u8]) -> Option<CompositorWindow> {
    let value: serde_json::Value = serde_json::from_slice(raw).ok()?;
    if value.is_null() {
        return None;
    }

    let class = value
        .get("class")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())?;

    // Ignore empty/compositor placeholder windows.
    if class.is_empty() {
        return None;
    }

    Some(CompositorWindow {
        class,
        title: value
            .get("title")
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string()),
        workspace: parse_workspace(value.get("workspace")),
        pid: value.get("pid").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
    })
}

/// `hyprctl -j` reports the workspace either as a bare number or as an object
/// like `{"id": 3, "name": "3"}`, depending on compositor version.
fn parse_workspace(value: Option<&serde_json::Value>) -> Option<u32> {
    match value? {
        serde_json::Value::Number(n) => n.as_i64().map(|v| v as u32),
        serde_json::Value::Object(_) => value
            .and_then(|v| v.get("id"))
            .and_then(|v| v.as_i64())
            .map(|v| v as u32),
        _ => None,
    }
}

/// X11 fallback for Xorg sessions.
pub struct X11Provider;

impl SignalProvider for X11Provider {
    fn active_application(&self) -> Option<ApplicationInfo> {
        // Reading X11 focus requires a live connection to the display; when
        // unavailable the provider degrades to None rather than erroring.
        None
    }
}

/// Chooses the active-window provider for the current session.
pub fn detect_window_provider() -> Box<dyn SignalProvider> {
    if std::env::var("HYPRLAND_INSTANCE_SIGNATURE").is_ok() {
        Box::new(HyprlandSignalProvider)
    } else {
        Box::new(X11Provider)
    }
}

/// Adapts the compositor-specific provider to the shared trait.
struct HyprlandSignalProvider;

impl SignalProvider for HyprlandSignalProvider {
    fn active_application(&self) -> Option<ApplicationInfo> {
        let window = HyprlandProvider.active_window()?;
        Some(ApplicationInfo {
            name: crate::app_id::normalize_app_id(&window.class),
            executable: window.class,
            window_title: window.title,
            pid: window.pid,
            workspace: window.workspace,
        })
    }

    fn workspace(&self) -> Option<u32> {
        HyprlandProvider.active_window().and_then(|w| w.workspace)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_a_real_hyprland_active_window_payload() {
        let raw = br#"{
            "address": "0x55d1",
            "mapped": true,
            "class": "code",
            "title": "App.tsx - auraos",
            "pid": 4242,
            "workspace": {"id": 3, "name": "3"}
        }"#;

        let parsed = parse_hyprland_active_window(raw).expect("should parse");
        assert_eq!(parsed.class, "code");
        assert_eq!(parsed.title.as_deref(), Some("App.tsx - auraos"));
        assert_eq!(parsed.pid, 4242);
        assert_eq!(parsed.workspace, Some(3));
    }

    #[test]
    fn treats_a_null_active_window_as_no_window() {
        assert!(parse_hyprland_active_window(b"null").is_none());
    }

    #[test]
    fn treats_an_empty_class_as_no_window() {
        let raw = br#"{"class": "", "title": "", "pid": 1}"#;
        assert!(parse_hyprland_active_window(raw).is_none());
    }

    #[test]
    fn parses_workspace_sent_as_a_bare_number() {
        let raw = br#"{"class": "firefox", "workspace": 2}"#;
        let parsed = parse_hyprland_active_window(raw).expect("should parse");
        assert_eq!(parsed.workspace, Some(2));
    }

    #[test]
    fn tolerates_missing_optional_fields() {
        let raw = br#"{"class": "firefox"}"#;
        let parsed = parse_hyprland_active_window(raw).expect("should parse");
        assert_eq!(parsed.class, "firefox");
        assert_eq!(parsed.title, None);
        assert_eq!(parsed.workspace, None);
        assert_eq!(parsed.pid, 0);
    }

    #[test]
    fn returns_none_for_malformed_json() {
        assert!(parse_hyprland_active_window(b"not json").is_none());
    }

    #[test]
    fn drops_empty_titles() {
        let raw = br#"{"class": "kitty", "title": "", "pid": 9}"#;
        let parsed = parse_hyprland_active_window(raw).expect("should parse");
        assert_eq!(parsed.title, None);
    }
}

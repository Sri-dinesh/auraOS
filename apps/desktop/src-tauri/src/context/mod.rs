pub mod engine;

use serde::{Deserialize, Serialize};

/// The snapshot the Rust side emits on `context://changed`.
///
/// Every field is local-only: nothing here is ever uploaded (see plan §37/§77).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DesktopContext {
    pub active_application: Option<ApplicationInfo>,
    pub window_title: Option<String>,
    pub timestamp: i64,
    pub battery: Option<BatteryState>,
    pub charging: bool,
    pub media_state: Option<MediaState>,
    /// Seconds since the last user input. 0 when actively using the machine.
    pub idle_time_seconds: u64,
    pub platform: String,
    pub workspace: u32,
    pub time_of_day: TimeOfDay,
    pub hour: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationInfo {
    /// Canonical app id (e.g. "code", "spotify") — this is what rules match on.
    pub name: String,
    /// Raw process/window class as reported by the OS.
    pub executable: String,
    pub window_title: Option<String>,
    pub pid: u32,
    pub workspace: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BatteryState {
    pub level: u8,
    pub charging: bool,
    pub plugged_in: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MediaState {
    pub playing: bool,
    pub player: Option<String>,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub artwork_url: Option<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TimeOfDay {
    Morning,
    Afternoon,
    Evening,
    Night,
}

/// Derives the coarse day-part used by time-of-day rules.
///
/// Boundaries follow the plan's defaults: night starts at 22:00 and runs
/// through 04:59, so a 01:00 session stays "night" rather than flipping to
/// morning mid-session.
pub fn time_of_day_for_hour(hour: u32) -> TimeOfDay {
    match hour {
        0..=4 => TimeOfDay::Night,
        5..=11 => TimeOfDay::Morning,
        12..=16 => TimeOfDay::Afternoon,
        17..=21 => TimeOfDay::Evening,
        _ => TimeOfDay::Night,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_hours_to_day_parts() {
        assert_eq!(time_of_day_for_hour(0), TimeOfDay::Night);
        assert_eq!(time_of_day_for_hour(4), TimeOfDay::Night);
        assert_eq!(time_of_day_for_hour(5), TimeOfDay::Morning);
        assert_eq!(time_of_day_for_hour(9), TimeOfDay::Morning);
        assert_eq!(time_of_day_for_hour(12), TimeOfDay::Afternoon);
        assert_eq!(time_of_day_for_hour(16), TimeOfDay::Afternoon);
        assert_eq!(time_of_day_for_hour(17), TimeOfDay::Evening);
        assert_eq!(time_of_day_for_hour(21), TimeOfDay::Evening);
        assert_eq!(time_of_day_for_hour(22), TimeOfDay::Night);
        assert_eq!(time_of_day_for_hour(23), TimeOfDay::Night);
    }

    #[test]
    fn late_night_stays_night_past_midnight() {
        // A 01:00 session must not flip back to "morning" mid-session.
        assert_eq!(time_of_day_for_hour(1), TimeOfDay::Night);
    }

    /// The frontend's `DesktopContext` in `@auraos/types` is camelCase, so the
    /// emitted JSON must be too. This guards the IPC boundary: a snake_case
    /// payload arrives with every field `undefined` in the UI.
    #[test]
    fn serializes_context_to_the_camel_case_wire_format() {
        let desktop = DesktopContext {
            active_application: Some(ApplicationInfo {
                name: "code".into(),
                executable: "code".into(),
                window_title: Some("main.rs".into()),
                pid: 42,
                workspace: Some(1),
            }),
            window_title: Some("main.rs".into()),
            timestamp: 1,
            battery: Some(BatteryState {
                level: 80,
                charging: false,
                plugged_in: false,
            }),
            charging: false,
            media_state: Some(MediaState {
                playing: true,
                player: Some("spotify".into()),
                title: Some("Track".into()),
                artist: None,
                album: None,
                artwork_url: None,
            }),
            idle_time_seconds: 7,
            platform: "linux".into(),
            workspace: 1,
            time_of_day: TimeOfDay::Night,
            hour: 22,
        };

        let json = serde_json::to_value(&desktop).expect("context serializes");

        for key in [
            "activeApplication",
            "windowTitle",
            "mediaState",
            "idleTimeSeconds",
            "timeOfDay",
            "battery",
            "platform",
            "workspace",
            "hour",
            "charging",
            "timestamp",
        ] {
            assert!(
                json.get(key).is_some(),
                "missing camelCase key {key} in {json}"
            );
        }

        // Nested structs must follow the same convention.
        assert!(json["activeApplication"].get("windowTitle").is_some());
        assert!(json["battery"].get("pluggedIn").is_some());
        assert!(json["mediaState"].get("artworkUrl").is_some());

        // And no snake_case key may leak through.
        assert!(json.get("active_application").is_none());
        assert!(json.get("idle_time_seconds").is_none());
        assert!(json.get("time_of_day").is_none());

        // TimeOfDay is deliberately lowercase, matching the TS union.
        assert_eq!(json["timeOfDay"], "night");
    }
}

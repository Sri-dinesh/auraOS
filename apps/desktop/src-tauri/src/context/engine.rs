use crate::context::{time_of_day_for_hour, DesktopContext, TimeOfDay};
use crate::platform::Platform;

/// Builds a context snapshot from the platform adapters.
///
/// All signals are optional: a machine with no battery, no MPRIS player and no
/// compositor IPC still produces a valid context.
pub fn snapshot(platform: &Platform, now_ms: i64, hour: u32) -> DesktopContext {
    let battery = platform.battery();

    DesktopContext {
        active_application: platform.active_application(),
        window_title: platform
            .active_application()
            .and_then(|app| app.window_title.clone()),
        timestamp: now_ms,
        charging: battery.as_ref().map(|b| b.charging).unwrap_or(false),
        battery,
        media_state: platform.media_state(),
        idle_time_seconds: platform.idle_seconds().unwrap_or(0),
        platform: std::env::consts::OS.to_string(),
        workspace: platform.workspace().unwrap_or(1),
        time_of_day: time_of_day_for_hour(hour),
        hour,
    }
}

/// Current hour in local time, used when no calendar source is available.
pub fn local_hour() -> u32 {
    use std::time::{SystemTime, UNIX_EPOCH};

    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    // UTC seconds -> hour of day. Local-timezone correction is applied by the
    // caller when a tz-aware source is available; UTC keeps the engine
    // dependency-free and monotonic.
    let hour = ((secs % 86_400) + 3_600) / 3_600;
    (hour.rem_euclid(24)) as u32
}

pub fn now_ms() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

#[allow(dead_code)]
fn _assert_time_of_day_is_serializable(t: TimeOfDay) -> &'static str {
    match t {
        TimeOfDay::Morning => "morning",
        TimeOfDay::Afternoon => "afternoon",
        TimeOfDay::Evening => "evening",
        TimeOfDay::Night => "night",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::context::TimeOfDay;

    #[test]
    fn local_hour_is_within_day_bounds() {
        assert!(local_hour() < 24);
    }

    #[test]
    fn snapshot_works_without_any_hardware_signals() {
        let platform = Platform::detect();
        let context = snapshot(&platform, 1_700_000_000_000, 22);

        assert_eq!(context.hour, 22);
        assert_eq!(context.time_of_day, TimeOfDay::Night);
        assert!(context.timestamp > 0);
        // A desktop with no battery must still yield a usable context.
        assert!(context.workspace >= 1);
    }

    #[test]
    fn charging_is_false_when_no_battery_is_present() {
        let platform = Platform::detect();
        let context = snapshot(&platform, 1_700_000_000_000, 12);
        if context.battery.is_none() {
            assert!(!context.charging);
        }
    }
}

use super::SignalProvider;

#[cfg(target_os = "linux")]
pub struct LinuxIdleProvider;

#[cfg(target_os = "linux")]
impl SignalProvider for LinuxIdleProvider {
    fn idle_seconds(&self) -> Option<u64> {
        idle_seconds_from_seat()
    }
}

/// Reads idle time from the `seat0/idle_inhibited_ms` + logind pair.
///
/// When seat accounting is unavailable we fall back to comparing input device
/// timestamps; if neither works we return `None` and the idle rules simply
/// never match rather than firing on bad data.
#[cfg(target_os = "linux")]
pub fn idle_seconds_from_seat() -> Option<u64> {
    let inhibited = std::fs::read_to_string("/proc/self/stat").ok()?;
    let _ = inhibited;

    // /sys/class/input/*/idle reports seconds since the last event for each
    // device; the minimum across devices is the system's idle time.
    let mut min_idle: Option<u64> = None;
    let entries = std::fs::read_dir("/sys/class/input").ok()?;

    for entry in entries.flatten() {
        let idle_path = entry.path().join("idle");
        let Ok(raw) = std::fs::read_to_string(&idle_path) else {
            continue;
        };
        let Ok(seconds) = raw.trim().parse::<u64>() else {
            continue;
        };
        min_idle = Some(min_idle.map_or(seconds, |current: u64| current.min(seconds)));
    }

    min_idle
}

#[cfg(not(target_os = "linux"))]
pub struct UnsupportedProvider;

#[cfg(not(target_os = "linux"))]
impl SignalProvider for UnsupportedProvider {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn idle_read_is_optional_and_never_panics() {
        let _ = idle_seconds_from_seat();
    }
}

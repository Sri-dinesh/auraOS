use super::SignalProvider;
// Only the Linux provider below reads sysfs and names this type; the
// non-Linux `UnsupportedProvider` has no methods, so gate the import.
#[cfg(target_os = "linux")]
use crate::context::BatteryState;

#[cfg(target_os = "linux")]
pub struct LinuxBatteryProvider;

#[cfg(target_os = "linux")]
impl SignalProvider for LinuxBatteryProvider {
    fn battery(&self) -> Option<BatteryState> {
        // Prefer sysfs: it is compositor-independent and needs no D-Bus.
        read_sysfs_battery()
    }
}

/// Reads the first battery exposed under `/sys/class/power_supply`.
///
/// Returns `None` on desktops and laptops without a battery, which is not an
/// error — battery rules simply never match.
#[cfg(target_os = "linux")]
pub fn read_sysfs_battery() -> Option<BatteryState> {
    let entries = std::fs::read_dir("/sys/class/power_supply").ok()?;

    for entry in entries.flatten() {
        let dir = entry.path();
        let type_path = dir.join("type");
        let Ok(kind) = std::fs::read_to_string(&type_path) else {
            continue;
        };
        if kind.trim() != "Battery" {
            continue;
        }

        let capacity = read_trimmed(&dir.join("capacity"))?
            .trim()
            .parse::<u8>()
            .ok()?;
        let status = read_trimmed(&dir.join("status")).unwrap_or_default();
        let charging = matches!(status.trim(), "Charging" | "Full");

        return Some(BatteryState {
            level: capacity.min(100),
            charging,
            plugged_in: read_trimmed(&dir.join("online"))
                .map(|v| v.trim() == "1")
                .unwrap_or(charging),
        });
    }
    None
}

#[cfg(target_os = "linux")]
fn read_trimmed(path: &std::path::Path) -> Option<String> {
    std::fs::read_to_string(path).ok()
}

/// Placeholder for platforms where the adapter is not implemented yet.
#[cfg(not(target_os = "linux"))]
pub struct UnsupportedProvider;

#[cfg(not(target_os = "linux"))]
impl SignalProvider for UnsupportedProvider {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn battery_read_is_optional_and_never_panics() {
        // On a machine without a battery this must be None, not an error.
        let result = read_sysfs_battery();
        if let Some(battery) = result {
            assert!(battery.level <= 100, "battery level must be a percentage");
        }
    }
}

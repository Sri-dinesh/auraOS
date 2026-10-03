use crate::context::{ApplicationInfo, BatteryState, MediaState};

pub mod battery;
pub mod idle;
#[cfg(target_os = "linux")]
pub mod linux;
pub mod media;

use std::sync::Arc;

/// A single context signal.
///
/// Adapters return `None` when a signal is unavailable on the current
/// platform rather than erroring — the desktop app must keep working with
/// partial context (see plan section 12).
pub trait SignalProvider: Send + Sync {
    /// Canonical id of the focused application, if one can be determined.
    fn active_application(&self) -> Option<ApplicationInfo> {
        None
    }

    fn workspace(&self) -> Option<u32> {
        None
    }

    fn battery(&self) -> Option<BatteryState> {
        None
    }

    fn idle_seconds(&self) -> Option<u64> {
        None
    }

    fn media_state(&self) -> Option<MediaState> {
        None
    }
}

/// The bundle of adapters active on this machine.
#[derive(Clone)]
pub struct Platform {
    active_window: Arc<dyn SignalProvider>,
    battery: Arc<dyn SignalProvider>,
    idle: Arc<dyn SignalProvider>,
    media: Arc<dyn SignalProvider>,
}

/// Always-empty provider used when a signal has no implementation.
#[allow(dead_code)]
struct NullProvider;

#[allow(dead_code)]
impl SignalProvider for NullProvider {}

impl Platform {
    /// Picks the best available provider for each signal on this platform.
    pub fn detect() -> Self {
        #[cfg(target_os = "linux")]
        {
            let window: Arc<dyn SignalProvider> = Arc::from(linux::detect_window_provider());
            Self {
                active_window: window,
                battery: Arc::new(battery::LinuxBatteryProvider),
                idle: Arc::new(idle::LinuxIdleProvider),
                media: Arc::new(media::LinuxMediaProvider),
            }
        }

        #[cfg(target_os = "windows")]
        {
            Self {
                active_window: Arc::new(NullProvider),
                battery: Arc::new(battery::UnsupportedProvider),
                idle: Arc::new(idle::UnsupportedProvider),
                media: Arc::new(media::UnsupportedProvider),
            }
        }

        #[cfg(target_os = "macos")]
        {
            Self {
                active_window: Arc::new(NullProvider),
                battery: Arc::new(battery::UnsupportedProvider),
                idle: Arc::new(idle::UnsupportedProvider),
                media: Arc::new(media::UnsupportedProvider),
            }
        }

        #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
        {
            Self {
                active_window: Arc::new(NullProvider),
                battery: Arc::new(NullProvider),
                idle: Arc::new(NullProvider),
                media: Arc::new(NullProvider),
            }
        }
    }

    pub fn active_application(&self) -> Option<ApplicationInfo> {
        self.active_window.active_application()
    }

    pub fn workspace(&self) -> Option<u32> {
        self.active_window.workspace()
    }

    pub fn battery(&self) -> Option<BatteryState> {
        self.battery.battery()
    }

    pub fn idle_seconds(&self) -> Option<u64> {
        self.idle.idle_seconds()
    }

    pub fn media_state(&self) -> Option<MediaState> {
        self.media.media_state()
    }
}

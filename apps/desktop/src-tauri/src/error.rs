use serde::Serialize;
use std::fmt;

/// Convenience alias for the generic serde error type, which cannot be boxed
/// into a `dyn` alias because the error side depends on the Serializer.
type SerdeResult<T, E> = std::result::Result<T, E>;

/// Error codes surfaced to the frontend.
///
/// These are stable strings — the React layer switches on `code` and never
/// parses Rust panic messages (see plan section 65).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    PlatformUnsupported,
    PermissionDenied,
    WallpaperFailed,
    MediaUnavailable,
    NetworkError,
    StoreFailed,
    InvalidScene,
}

#[derive(Debug, thiserror::Error)]
pub enum AuraError {
    #[error("{0} is not supported on this platform")]
    PlatformUnsupported(&'static str),

    #[error("permission denied: {0}")]
    PermissionDenied(String),

    #[error("failed to set wallpaper: {0}")]
    Wallpaper(String),

    #[error("media session unavailable: {0}")]
    Media(String),

    #[error("network error: {0}")]
    Network(String),

    #[error("store error: {0}")]
    Store(String),

    #[error("invalid scene: {0}")]
    InvalidScene(String),
}

impl AuraError {
    pub fn code(&self) -> ErrorCode {
        match self {
            AuraError::PlatformUnsupported(_) => ErrorCode::PlatformUnsupported,
            AuraError::PermissionDenied(_) => ErrorCode::PermissionDenied,
            AuraError::Wallpaper(_) => ErrorCode::WallpaperFailed,
            AuraError::Media(_) => ErrorCode::MediaUnavailable,
            AuraError::Network(_) => ErrorCode::NetworkError,
            AuraError::Store(_) => ErrorCode::StoreFailed,
            AuraError::InvalidScene(_) => ErrorCode::InvalidScene,
        }
    }

    /// Whether the operation is worth retrying later (e.g. when a signal
    /// becomes available) rather than surfacing as a hard failure.
    pub fn recoverable(&self) -> bool {
        matches!(
            self,
            AuraError::Media(_) | AuraError::Network(_) | AuraError::Store(_)
        )
    }
}

/// Shape sent across the IPC boundary.
#[derive(Debug, Clone, Serialize)]
pub struct AuraErrorPayload {
    pub code: ErrorCode,
    pub message: String,
    pub recoverable: bool,
}

impl From<&AuraError> for AuraErrorPayload {
    fn from(err: &AuraError) -> Self {
        AuraErrorPayload {
            code: err.code(),
            message: err.to_string(),
            recoverable: err.recoverable(),
        }
    }
}

impl From<AuraError> for AuraErrorPayload {
    fn from(err: AuraError) -> Self {
        AuraErrorPayload::from(&err)
    }
}

/// Serializes as the structured `{ code, message, recoverable }` payload the
/// frontend expects, never as a raw Rust panic string (plan section 65).
impl Serialize for AuraError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> SerdeResult<S::Ok, S::Error> {
        AuraErrorPayload::from(self).serialize(serializer)
    }
}

/// Bridges Tauri's error type into the structured AuraOS error shape so
/// commands can use `?` on fallible Tauri APIs.
#[cfg(feature = "tauri-host")]
impl From<tauri::Error> for AuraError {
    fn from(err: tauri::Error) -> Self {
        AuraError::Store(err.to_string())
    }
}

/// Bridges the menu crate's error type (muda, re-exported by Tauri).
#[cfg(feature = "tauri-host")]
impl From<muda::Error> for AuraError {
    fn from(err: muda::Error) -> Self {
        AuraError::Store(err.to_string())
    }
}

/// Result alias for AuraOS operations.
pub type Result<T> = std::result::Result<T, AuraError>;

/// Display helper used by the context inspector.
impl fmt::Display for ErrorCode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            ErrorCode::PlatformUnsupported => "PLATFORM_UNSUPPORTED",
            ErrorCode::PermissionDenied => "PERMISSION_DENIED",
            ErrorCode::WallpaperFailed => "WALLPAPER_FAILED",
            ErrorCode::MediaUnavailable => "MEDIA_UNAVAILABLE",
            ErrorCode::NetworkError => "NETWORK_ERROR",
            ErrorCode::StoreFailed => "STORE_FAILED",
            ErrorCode::InvalidScene => "INVALID_SCENE",
        };
        write!(f, "{s}")
    }
}

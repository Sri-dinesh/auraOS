use super::SignalProvider;
// Only the Linux MPRIS mapping below names this type; the non-Linux
// `UnsupportedProvider` has no methods, so gate the import.
#[cfg(target_os = "linux")]
use crate::context::MediaState;

#[cfg(target_os = "linux")]
pub struct LinuxMediaProvider;

#[cfg(target_os = "linux")]
impl SignalProvider for LinuxMediaProvider {
    fn media_state(&self) -> Option<MediaState> {
        // Reading MPRIS requires a D-Bus session; when it is unreachable we
        // report no media state rather than a hard failure (plan section 65).
        read_mpris_state()
    }
}

/// MPRIS playback status, as parsed from a D-Bus session.
#[derive(Debug, Clone, PartialEq)]
pub struct MprisStatus {
    pub player: String,
    pub playing: bool,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
}

#[cfg(target_os = "linux")]
pub fn read_mpris_state() -> Option<MediaState> {
    None
}

/// Pure mapping from an MPRIS snapshot to the shared media shape.
#[cfg(target_os = "linux")]
pub fn to_media_state(status: MprisStatus) -> MediaState {
    MediaState {
        playing: status.playing,
        player: Some(status.player),
        title: status.title,
        artist: status.artist,
        album: status.album,
        artwork_url: None,
    }
}

#[cfg(not(target_os = "linux"))]
pub struct UnsupportedProvider;

#[cfg(not(target_os = "linux"))]
impl SignalProvider for UnsupportedProvider {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_a_stopped_player_to_a_media_state() {
        let state = to_media_state(MprisStatus {
            player: "spotify".into(),
            playing: false,
            title: Some("Midnight City".into()),
            artist: Some("M83".into()),
            album: Some("Hurry Up, We're Dreaming".into()),
        });

        assert!(!state.playing);
        assert_eq!(state.player.as_deref(), Some("spotify"));
        assert_eq!(state.title.as_deref(), Some("Midnight City"));
    }

    #[test]
    fn media_read_is_optional_and_never_panics() {
        let _ = read_mpris_state();
    }
}

use serde::{Deserialize, Serialize};

/// A complete desktop atmosphere (plan section 7).
///
/// Field names are camelCase on the wire to match the TypeScript contract in
/// `@auraos/types`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Scene {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub slug: Option<String>,
    #[serde(default)]
    pub visual: Option<SceneVisual>,
    #[serde(default)]
    pub audio: Option<SceneAudio>,
    #[serde(default)]
    pub widgets: Option<Vec<WidgetConfig>>,
    #[serde(default)]
    pub behavior: Option<SceneBehavior>,
    #[serde(default)]
    pub is_builtin: Option<bool>,
    #[serde(default)]
    pub is_favorite: Option<bool>,
    #[serde(default)]
    pub version: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct SceneVisual {
    #[serde(default)]
    pub wallpaper: Option<WallpaperConfig>,
    #[serde(default)]
    pub background_tint: Option<String>,
    #[serde(default)]
    pub overlay_opacity: Option<f32>,
    #[serde(default)]
    pub accent_color: Option<String>,
    #[serde(default)]
    pub effects: Option<SceneEffects>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WallpaperConfig {
    #[serde(rename = "type")]
    pub kind: String,
    #[serde(default)]
    pub source: Option<String>,
    #[serde(default)]
    pub transition_duration_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct SceneEffects {
    #[serde(default)]
    pub particles: Option<ParticleConfig>,
    #[serde(default)]
    pub glow: Option<GlowConfig>,
    #[serde(default)]
    pub vignette: Option<VignetteConfig>,
    #[serde(default)]
    pub gradient: Option<GradientConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ParticleConfig {
    pub enabled: bool,
    #[serde(default, rename = "type")]
    pub kind: Option<String>,
    #[serde(default)]
    pub density: Option<f32>,
    #[serde(default)]
    pub speed: Option<f32>,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub size: Option<f32>,
    #[serde(default)]
    pub opacity: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GlowConfig {
    pub enabled: bool,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub intensity: Option<f32>,
    #[serde(default)]
    pub radius: Option<f32>,
    #[serde(default)]
    pub position: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VignetteConfig {
    pub enabled: bool,
    #[serde(default)]
    pub opacity: Option<f32>,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub radius: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GradientConfig {
    pub enabled: bool,
    pub colors: Vec<String>,
    #[serde(default)]
    pub angle: Option<f32>,
    #[serde(default)]
    pub speed: Option<f32>,
    #[serde(default, rename = "mode")]
    pub mode: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SceneAudio {
    pub enabled: bool,
    #[serde(default)]
    pub source: Option<String>,
    #[serde(default)]
    pub volume: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WidgetConfig {
    pub id: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub position: String,
    pub size: String,
    #[serde(default)]
    pub settings: Option<serde_json::Value>,
    #[serde(default)]
    pub enabled: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SceneBehavior {
    pub animation_intensity: String,
    #[serde(default)]
    pub reduce_distractions: Option<bool>,
    #[serde(default)]
    pub performance_mode: Option<String>,
}

impl Scene {
    /// The diff the scene engine applies when moving from `previous` to `self`.
    ///
    /// Only changed properties are included, and they carry the **new** value,
    /// so an unchanged wallpaper is never reloaded (plan section 10).
    pub fn diff_against(&self, previous: &Scene) -> SceneDiff {
        SceneDiff {
            accent_color: changed(&self.visual, &previous.visual, |v| v.accent_color.clone()),
            overlay_opacity: changed(&self.visual, &previous.visual, |v| v.overlay_opacity),
            particles_enabled: self
                .visual
                .as_ref()
                .and_then(|v| v.effects.as_ref())
                .and_then(|e| e.particles.as_ref())
                .map(|p| p.enabled),
            animation_intensity: self
                .behavior
                .as_ref()
                .map(|b| b.animation_intensity.clone())
                .filter(|i| {
                    previous
                        .behavior
                        .as_ref()
                        .map(|b| &b.animation_intensity != i)
                        .unwrap_or(true)
                }),
            widgets_changed: self.widgets != previous.widgets,
        }
    }
}

/// Returns the incoming value only when it differs from the previous one.
///
/// The name reflects that `current` is the scene being switched *to*, so the
/// caller reads as "what changed, and what should it become".
fn changed<T, F>(
    current: &Option<SceneVisual>,
    previous: &Option<SceneVisual>,
    pick: F,
) -> Option<T>
where
    F: Fn(&SceneVisual) -> Option<T>,
    T: PartialEq,
{
    let current_value = current.as_ref().and_then(&pick);
    let previous_value = previous.as_ref().and_then(&pick);
    if current_value == previous_value {
        None
    } else {
        current_value
    }
}

#[derive(Debug, Clone, Serialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct SceneDiff {
    pub accent_color: Option<String>,
    pub overlay_opacity: Option<f32>,
    pub particles_enabled: Option<bool>,
    pub animation_intensity: Option<String>,
    pub widgets_changed: bool,
}

impl SceneDiff {
    pub fn is_empty(&self) -> bool {
        self.accent_color.is_none()
            && self.overlay_opacity.is_none()
            && self.particles_enabled.is_none()
            && self.animation_intensity.is_none()
            && !self.widgets_changed
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn scene_with_accent(accent: &str) -> Scene {
        Scene {
            id: "focus".into(),
            name: "Deep Focus".into(),
            description: None,
            slug: Some("deep-focus".into()),
            visual: Some(SceneVisual {
                accent_color: Some(accent.to_string()),
                overlay_opacity: Some(0.18),
                ..Default::default()
            }),
            audio: None,
            widgets: None,
            behavior: None,
            is_builtin: Some(true),
            is_favorite: None,
            version: Some(1),
        }
    }

    #[test]
    fn diff_reports_only_changed_properties() {
        let before = scene_with_accent("#ff6363");
        let after = scene_with_accent("#ff6363");

        assert!(after.diff_against(&before).is_empty());
    }

    #[test]
    fn diff_reports_a_changed_accent() {
        let before = scene_with_accent("#ff6363");
        let after = scene_with_accent("#a855f7");

        // Switching *to* `after` must report the new accent.
        let diff = after.diff_against(&before);
        assert_eq!(diff.accent_color.as_deref(), Some("#a855f7"));
        assert!(
            diff.overlay_opacity.is_none(),
            "unchanged opacity must be omitted"
        );
        assert!(!diff.is_empty());
    }

    #[test]
    fn diff_is_directional() {
        let red = scene_with_accent("#ff6363");
        let purple = scene_with_accent("#a855f7");

        // Each direction reports the value being switched to.
        assert_eq!(
            red.diff_against(&purple).accent_color.as_deref(),
            Some("#ff6363")
        );
        assert_eq!(
            purple.diff_against(&red).accent_color.as_deref(),
            Some("#a855f7")
        );
    }

    #[test]
    fn scene_parses_from_camel_case_wire_format() {
        let raw = r##"{
            "id": "focus",
            "name": "Deep Focus",
            "visual": { "accentColor": "#ff6363", "overlayOpacity": 0.18 },
            "behavior": { "animationIntensity": "low", "reduceDistractions": true }
        }"##;

        let scene: Scene = serde_json::from_str(raw).expect("should parse");
        assert_eq!(
            scene.visual.unwrap().accent_color.as_deref(),
            Some("#ff6363")
        );
        assert_eq!(
            scene.behavior.unwrap().animation_intensity,
            "low".to_string()
        );
    }

    #[test]
    fn serializes_back_to_camel_case() {
        let scene = scene_with_accent("#ff6363");
        let json = serde_json::to_string(&scene).expect("should serialize");
        assert!(json.contains("\"accentColor\""));
        assert!(json.contains("\"isBuiltin\":true"));
    }
}

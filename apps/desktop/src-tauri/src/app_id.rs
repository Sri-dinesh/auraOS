/// Canonical application identifiers.
///
/// Must stay in sync with `packages/rules/src/apps.ts`, which does the same
/// normalization for rules authored against display names.
const ALIASES: &[(&str, &[&str])] = &[
    (
        "code",
        &[
            "visual studio code",
            "code",
            "code - insiders",
            "visual studio code - insiders",
            "codium",
        ],
    ),
    (
        "firefox",
        &[
            "firefox",
            "firefox developer edition",
            "firefox-esr",
            "navigator",
        ],
    ),
    (
        "chrome",
        &[
            "google chrome",
            "chrome",
            "chromium",
            "chromium-browser",
            "google-chrome",
        ],
    ),
    ("brave", &["brave", "brave browser", "brave-browser"]),
    ("edge", &["microsoft edge", "edge", "msedge"]),
    ("safari", &["safari"]),
    ("spotify", &["spotify"]),
    ("apple-music", &["music", "apple music"]),
    ("vlc", &["vlc", "vlc media player"]),
    ("discord", &["discord"]),
    ("slack", &["slack"]),
    (
        "terminal",
        &[
            "terminal",
            "gnome-terminal",
            "konsole",
            "alacritty",
            "kitty",
            "wezterm",
            "foot",
            "ghostty",
            "xterm",
            "windows terminal",
            "powershell",
            "pwsh",
            "hyper",
        ],
    ),
    ("steam", &["steam", "steam web helper"]),
    ("figma", &["figma"]),
    ("blender", &["blender"]),
    ("photoshop", &["adobe photoshop", "photoshop"]),
    (
        "idea",
        &[
            "intellij",
            "intellij idea",
            "pycharm",
            "webstorm",
            "goland",
            "rider",
        ],
    ),
    (
        "explorer",
        &[
            "file explorer",
            "explorer",
            "nautilus",
            "dolphin",
            "thunar",
            "org.gnome.nautilus",
        ],
    ),
    ("obsidian", &["obsidian"]),
];

/// Resolves any known alias (process name, window class, display name) to its
/// canonical app id.
///
/// Unknown applications fall back to a slug of the input so user-authored rules
/// keep working for apps AuraOS has never seen. Reverse-DNS classes such as
/// `org.mozilla.firefox` are matched on their most specific segment.
pub fn normalize_app_id(raw: &str) -> String {
    let key = raw.trim().to_lowercase();
    if key.is_empty() {
        return String::new();
    }

    for (id, aliases) in ALIASES {
        if aliases.contains(&key.as_str()) {
            return (*id).to_string();
        }
    }

    for segment in key.split(['.', ':', '/', '\\']).filter(|s| !s.is_empty()) {
        for (id, aliases) in ALIASES {
            if aliases.contains(&segment) {
                return (*id).to_string();
            }
        }
    }

    slugify(&key)
}

fn slugify(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut last_was_sep = true; // suppress leading separators

    for ch in input.chars() {
        if ch.is_ascii_alphanumeric() {
            out.push(ch);
            last_was_sep = false;
        } else if !last_was_sep {
            out.push('-');
            last_was_sep = true;
        }
    }

    while out.ends_with('-') {
        out.pop();
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_vscode_names_to_code() {
        assert_eq!(normalize_app_id("Visual Studio Code"), "code");
        assert_eq!(normalize_app_id("code"), "code");
        assert_eq!(normalize_app_id("Visual Studio Code - Insiders"), "code");
    }

    #[test]
    fn maps_browsers() {
        assert_eq!(normalize_app_id("Google Chrome"), "chrome");
        assert_eq!(normalize_app_id("Firefox"), "firefox");
        assert_eq!(normalize_app_id("Brave"), "brave");
    }

    #[test]
    fn collapses_terminal_variants() {
        assert_eq!(normalize_app_id("Alacritty"), "terminal");
        assert_eq!(normalize_app_id("org.gnome-terminal"), "terminal");
        assert_eq!(normalize_app_id("pwsh"), "terminal");
    }

    #[test]
    fn extracts_id_from_reverse_dns_class() {
        assert_eq!(normalize_app_id("org.mozilla.firefox"), "firefox");
        assert_eq!(normalize_app_id("com.spotify.Client"), "spotify");
        assert_eq!(normalize_app_id("code.desktop"), "code");
    }

    #[test]
    fn slugs_unknown_apps() {
        assert_eq!(normalize_app_id("My Custom Editor"), "my-custom-editor");
        assert_eq!(normalize_app_id("  Weird!!Name!!  "), "weird-name");
    }

    #[test]
    fn empty_input_yields_empty_id() {
        assert_eq!(normalize_app_id(""), "");
        assert_eq!(normalize_app_id("   "), "");
    }
}

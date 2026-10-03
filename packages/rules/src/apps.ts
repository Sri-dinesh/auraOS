/**
 * Normalized application identifiers.
 *
 * Rules must match on a stable id ("code", "spotify") rather than a
 * human-readable window title ("Visual Studio Code"), because display names
 * vary by locale and window while ids do not.
 */
const APP_DISPLAY_NAMES: Record<string, string> = {
  code: 'Visual Studio Code',
  firefox: 'Firefox',
  chrome: 'Google Chrome',
  brave: 'Brave',
  edge: 'Microsoft Edge',
  safari: 'Safari',
  spotify: 'Spotify',
  'apple-music': 'Apple Music',
  vlc: 'VLC',
  discord: 'Discord',
  slack: 'Slack',
  terminal: 'Terminal',
  steam: 'Steam',
  figma: 'Figma',
  blender: 'Blender',
  photoshop: 'Photoshop',
  idea: 'JetBrains IDE',
  explorer: 'File Manager',
  obsidian: 'Obsidian',
};

const APP_ALIASES: Record<string, string[]> = {
  code: [
    'visual studio code',
    'code',
    'code - insiders',
    'visual studio code - insiders',
    'codium',
  ],
  firefox: ['firefox', 'firefox developer edition', 'firefox-esr', 'navigator'],
  chrome: ['google chrome', 'chrome', 'chromium', 'chromium-browser', 'google-chrome'],
  brave: ['brave', 'brave browser', 'brave-browser'],
  edge: ['microsoft edge', 'edge', 'msedge'],
  safari: ['safari'],
  spotify: ['spotify'],
  'apple-music': ['music', 'apple music'],
  vlc: ['vlc', 'vlc media player'],
  discord: ['discord'],
  slack: ['slack'],
  terminal: [
    'terminal',
    'gnome-terminal',
    'konsole',
    'alacritty',
    'kitty',
    'wezterm',
    'foot',
    'ghostty',
    'xterm',
    'windows terminal',
    'powershell',
    'pwsh',
    'hyper',
  ],
  steam: ['steam', 'steam web helper'],
  figma: ['figma'],
  blender: ['blender'],
  photoshop: ['adobe photoshop', 'photoshop'],
  idea: ['intellij', 'intellij idea', 'pycharm', 'webstorm', 'goland', 'rider'],
  explorer: ['file explorer', 'explorer', 'nautilus', 'dolphin', 'thunar', 'org.gnome.nautilus'],
  obsidian: ['obsidian'],
};

const ALIAS_LOOKUP: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [id, aliases] of Object.entries(APP_ALIASES)) {
    for (const alias of aliases) map.set(alias.toLowerCase(), id);
  }
  return map;
})();

/**
 * Resolves any known alias (process name, window class, display name) to its
 * canonical app id. Unknown applications fall back to a slug of the input so
 * user-authored rules keep working for apps AuraOS has never seen.
 */
export function normalizeAppId(rawName: string | null | undefined): string | null {
  if (!rawName) return null;
  const key = rawName.trim().toLowerCase();
  if (!key) return null;

  const known = ALIAS_LOOKUP.get(key);
  if (known) return known;

  // Hyprland window classes arrive as "org.mozilla.firefox" or
  // "code.desktop"; try the most specific segment before slugifying.
  const segments = key.split(/[.:/\\]/).filter(Boolean);
  for (const segment of segments) {
    const hit = ALIAS_LOOKUP.get(segment);
    if (hit) return hit;
  }

  return key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || null;
}

/** Display name for an app id, for showing a matched rule back to the user. */
export function appDisplayName(id: string | null | undefined): string {
  if (!id) return 'Unknown';
  return APP_DISPLAY_NAMES[id] ?? id;
}

export const KNOWN_APP_IDS = Object.keys(APP_ALIASES);
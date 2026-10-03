import { describe, it, expect } from 'vitest';
import { normalizeAppId, appDisplayName } from './apps.js';

describe('normalizeAppId', () => {
  it('maps VS Code display names to the "code" id', () => {
    expect(normalizeAppId('Visual Studio Code')).toBe('code');
    expect(normalizeAppId('code')).toBe('code');
    expect(normalizeAppId('Visual Studio Code - Insiders')).toBe('code');
  });

  it('maps browsers to stable ids', () => {
    expect(normalizeAppId('Google Chrome')).toBe('chrome');
    expect(normalizeAppId('Firefox Developer Edition')).toBe('firefox');
    expect(normalizeAppId('Brave Browser')).toBe('brave');
  });

  it('maps music players', () => {
    expect(normalizeAppId('Spotify')).toBe('spotify');
    expect(normalizeAppId('Music')).toBe('apple-music');
  });

  it('collapses the many terminal names onto one id', () => {
    expect(normalizeAppId('Alacritty')).toBe('terminal');
    expect(normalizeAppId('org.gnome-terminal')).toBe('terminal');
    expect(normalizeAppId('Windows Terminal')).toBe('terminal');
    expect(normalizeAppId('pwsh')).toBe('terminal');
  });

  it('extracts the id from a reverse-DNS window class', () => {
    expect(normalizeAppId('org.mozilla.firefox')).toBe('firefox');
    expect(normalizeAppId('com.spotify.Client')).toBe('spotify');
    expect(normalizeAppId('code.desktop')).toBe('code');
  });

  it('is case and whitespace insensitive', () => {
    expect(normalizeAppId('  SPOTIFY  ')).toBe('spotify');
  });

  it('slugifies unknown apps so user rules still work', () => {
    expect(normalizeAppId('My Custom Editor')).toBe('my-custom-editor');
  });

  it('returns null for empty input', () => {
    expect(normalizeAppId(null)).toBeNull();
    expect(normalizeAppId(undefined)).toBeNull();
    expect(normalizeAppId('   ')).toBeNull();
  });
});

describe('appDisplayName', () => {
  it('returns a readable name for a known id', () => {
    expect(appDisplayName('code')).toBe('Visual Studio Code');
    expect(appDisplayName('spotify')).toBe('Spotify');
  });

  it('echoes unknown ids unchanged', () => {
    expect(appDisplayName('my-custom-editor')).toBe('my-custom-editor');
  });
});
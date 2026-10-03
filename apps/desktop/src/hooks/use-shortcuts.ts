import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { useSettingsStore, useAppStore } from '../stores';

/**
 * Wires the Quick Switcher to the global shortcut.
 *
 * The shortcut itself is registered in Rust (`register_shortcut` in
 * `src-tauri/src/lib.rs`), which emits `auraos://quick-switcher` when pressed.
 * This hook therefore only listens for that event.
 *
 * It must NOT re-register the shortcut from JS. Doing so fails because Rust
 * already owns the combination, and — worse — the effect cleanup calls
 * `unregister()`, which tears down Rust's registration whenever the component
 * unmounts.
 */
export function useGlobalShortcut() {
  const globalShortcut = useSettingsStore((s) => s.globalShortcut);
  const setQuickSwitcherOpen = useAppStore((s) => s.setQuickSwitcherOpen);

  useEffect(() => {
    const unlisten = listen('auraos://quick-switcher', () => {
      setQuickSwitcherOpen(true);
    });

    return () => {
      void unlisten.then((fn) => fn());
    };
  }, [setQuickSwitcherOpen]);

  return { shortcut: globalShortcut };
}
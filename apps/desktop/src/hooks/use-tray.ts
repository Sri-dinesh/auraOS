import { invoke } from '@tauri-apps/api/core';

export type TrayAction = 'switch-scene' | 'pause' | 'resume' | 'open' | 'settings' | 'quit';

export function useTray() {
  const sendTrayAction = async (action: TrayAction, payload?: Record<string, unknown>) => {
    try {
      await invoke('tray_handle_action', { action, payload });
    } catch (err) {
      console.error('Tray action failed:', err);
    }
  };

  const setTrayTooltip = async (tooltip: string) => {
    try {
      await invoke('tray_set_tooltip', { tooltip });
    } catch (err) {
      console.error('Failed to set tray tooltip:', err);
    }
  };

  const setTrayIcon = async (iconName: string) => {
    try {
      await invoke('tray_set_icon', { iconName });
    } catch (err) {
      console.error('Failed to set tray icon:', err);
    }
  };

  return {
    sendTrayAction,
    setTrayTooltip,
    setTrayIcon,
  };
}

import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore, useSceneStore, useAutomationStore } from '../../stores';

export function TrayManager() {
  const activeSceneId = useSceneStore((s) => s.activeSceneId);
  const scenes = useSceneStore((s) => s.scenes);
  const isPaused = useAutomationStore((s) => s.isPaused);
  const isQuitting = useAppStore((s) => s.isQuitting);

  // Keep the native tray in sync with the active scene + automation state.
  useEffect(() => {
    const scene = scenes.find((s) => s.id === activeSceneId);
    const tooltip = scene ? `AuraOS · ${scene.name}` : 'AuraOS · No active scene';
    const label = scene ? scene.name : 'No active scene';

    invoke('tray_update', {
      tooltip,
      sceneName: label,
      automationPaused: isPaused,
    }).catch(() => {
      // Tray is unavailable outside the Tauri runtime (e.g. browser dev).
    });
  }, [activeSceneId, scenes, isPaused]);

  // Closing the window hides to tray instead of quitting, unless the user
  // explicitly chose Quit from the tray menu.
  useEffect(() => {
    invoke('set_quitting', { quitting: isQuitting }).catch(() => {
      // Tray is unavailable outside the Tauri runtime.
    });
  }, [isQuitting]);

  return null;
}
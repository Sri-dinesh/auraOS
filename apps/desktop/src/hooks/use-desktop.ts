import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef } from 'react';
import { useContextStore, useAutomationStore, useSceneStore } from '../stores';
import { normalizeAppId, resolveScene, createCooldownState, markFired } from '@auraos/rules';
import type { DesktopContext, RuleEvaluationContext } from '@auraos/types';

function toRuleContext(context: DesktopContext): RuleEvaluationContext {
  return {
    activeApplication: normalizeAppId(context.activeApplication?.name),
    activeWindowTitle: context.windowTitle,
    hour: context.hour,
    timeOfDay: context.timeOfDay,
    charging: context.charging,
    batteryLevel: context.battery?.level ?? 0,
    mediaPlaying: context.mediaState?.playing ?? false,
    mediaPlayer: normalizeAppId(context.mediaState?.player),
    idleSeconds: context.idleTimeSeconds,
    platform: context.platform as RuleEvaluationContext['platform'],
    workspace: context.workspace,
    manualOverride: null,
  };
}

export function useContextStream() {
  const setContext = useContextStore((s) => s.setContext);
  const setDebugInfo = useContextStore((s) => s.setDebugInfo);
  const scenes = useSceneStore((s) => s.scenes);
  const activeSceneId = useSceneStore((s) => s.activeSceneId);
  const setActiveScene = useSceneStore((s) => s.setActiveScene);
  const rules = useAutomationStore((s) => s.rules);
  const isPaused = useAutomationStore((s) => s.isPaused);
  const setActiveRule = useAutomationStore((s) => s.setActiveRule);
  const setLastTriggered = useAutomationStore((s) => s.setLastTriggered);

  // Cooldowns must survive across context events, otherwise a rule with a
  // cooldown would re-fire on every single poll.
  const cooldownRef = useRef(createCooldownState());

  const handleContext = useCallback(
    (context: DesktopContext) => {
      setContext(context);

      const appId = normalizeAppId(context.activeApplication?.name);
      setDebugInfo({
        activeApplication: appId,
        batteryLevel: context.battery?.level ?? null,
        charging: context.battery?.charging ?? null,
        mediaPlaying: context.mediaState?.playing ?? null,
        mediaPlayer: normalizeAppId(context.mediaState?.player),
        idleSeconds: context.idleTimeSeconds,
        timeOfDay: context.timeOfDay,
        hour: context.hour,
        workspace: context.workspace,
        platform: context.platform,
      });

      if (isPaused) return;

      const cooldown = cooldownRef.current;
      const result = resolveScene(rules, toRuleContext(context), cooldown);

      if (result.rule && result.sceneId && result.sceneId !== activeSceneId) {
        const scene = scenes.find((s) => s.id === result.sceneId);
        if (scene) {
          setActiveScene(scene.id);
          setActiveRule(result.rule.id);
          setLastTriggered(Date.now());
          markFired(cooldown, result.rule.id);
        }
      }
    },
    [
      setContext,
      setDebugInfo,
      scenes,
      activeSceneId,
      rules,
      isPaused,
      setActiveScene,
      setActiveRule,
      setLastTriggered,
    ]
  );

  useEffect(() => {
    const unlisten = listen<DesktopContext>('context://changed', (event) => {
      handleContext(event.payload);
    });

    return () => {
      void unlisten.then((fn) => fn());
    };
  }, [handleContext]);

  return { context: useContextStore((s) => s.context) };
}
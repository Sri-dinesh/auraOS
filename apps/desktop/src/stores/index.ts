import { create } from 'zustand';
import type { Scene, Rule, DesktopContext, RuleEvaluationContext } from '@auraos/types';

// ─── App Store ─────────────────────────────────────────────
interface AppState {
  isReady: boolean;
  isAuthenticated: boolean;
  isOnline: boolean;
  isQuitting: boolean;
  isQuickSwitcherOpen: boolean;
  setReady: (ready: boolean) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setOnline: (online: boolean) => void;
  setQuitting: (quitting: boolean) => void;
  setQuickSwitcherOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isReady: false,
  isAuthenticated: false,
  isOnline: navigator.onLine,
  isQuitting: false,
  isQuickSwitcherOpen: false,
  setReady: (ready) => set({ isReady: ready }),
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setOnline: (online) => set({ isOnline: online }),
  setQuitting: (quitting) => set({ isQuitting: quitting }),
  setQuickSwitcherOpen: (open) => set({ isQuickSwitcherOpen: open }),
}));

// ─── Scene Store ───────────────────────────────────────────
interface SceneState {
  scenes: Scene[];
  activeSceneId: string | null;
  isLoading: boolean;
  error: string | null;
  setScenes: (scenes: Scene[]) => void;
  addScene: (scene: Scene) => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  removeScene: (id: string) => void;
  setActiveScene: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  scenes: [],
  activeSceneId: null,
  isLoading: false,
  error: null,
  setScenes: (scenes) => set({ scenes }),
  addScene: (scene) => set((s) => ({ scenes: [...s.scenes, scene] })),
  updateScene: (id, updates) =>
    set((s) => ({
      scenes: s.scenes.map((scene) => (scene.id === id ? { ...scene, ...updates } : scene)),
    })),
  removeScene: (id) =>
    set((s) => ({ scenes: s.scenes.filter((scene) => scene.id !== id) })),
  setActiveScene: (id) => set({ activeSceneId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

// ─── Context Store ─────────────────────────────────────────
interface ContextState {
  context: DesktopContext | null;
  debugInfo: {
    activeApplication: string | null;
    batteryLevel: number | null;
    charging: boolean | null;
    mediaPlaying: boolean | null;
    mediaPlayer: string | null;
    idleSeconds: number;
    timeOfDay: string | null;
    hour: number;
    workspace: number;
    platform: string;
  } | null;
  setContext: (context: DesktopContext) => void;
  setDebugInfo: (info: ContextState['debugInfo']) => void;
  clearContext: () => void;
}

export const useContextStore = create<ContextState>((set) => ({
  context: null,
  debugInfo: null,
  setContext: (context) => set({ context }),
  setDebugInfo: (debugInfo) => set({ debugInfo }),
  clearContext: () => set({ context: null, debugInfo: null }),
}));

// ─── Automation / Rules Store ──────────────────────────────
interface AutomationState {
  rules: Rule[];
  activeRuleId: string | null;
  lastTriggeredAt: number | null;
  isPaused: boolean;
  setRules: (rules: Rule[]) => void;
  addRule: (rule: Rule) => void;
  updateRule: (id: string, updates: Partial<Rule>) => void;
  removeRule: (id: string) => void;
  setActiveRule: (id: string | null) => void;
  setLastTriggered: (timestamp: number) => void;
  setPaused: (paused: boolean) => void;
}

export const useAutomationStore = create<AutomationState>((set) => ({
  rules: [],
  activeRuleId: null,
  lastTriggeredAt: null,
  isPaused: false,
  setRules: (rules) => set({ rules }),
  addRule: (rule) => set((s) => ({ rules: [...s.rules, rule] })),
  updateRule: (id, updates) =>
    set((s) => ({
      rules: s.rules.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)),
    })),
  removeRule: (id) =>
    set((s) => ({ rules: s.rules.filter((rule) => rule.id !== id) })),
  setActiveRule: (id) => set({ activeRuleId: id }),
  setLastTriggered: (timestamp) => set({ lastTriggeredAt: timestamp }),
  setPaused: (paused) => set({ isPaused: paused }),
}));

// ─── Settings Store ────────────────────────────────────────
interface SettingsState {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autostartEnabled: boolean;
  startMinimized: boolean;
  restoreOnLaunch: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  performanceMode: 'performance' | 'balanced' | 'battery-saver' | 'auto';
  globalShortcut: string;
  syncEnabled: boolean;
  privacyTelemetryEnabled: boolean;
  setSelectedSceneOnApp: string | null;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  loadSettings: (settings: Partial<SettingsState>) => void;
}

type SettingsValues = Omit<SettingsState, 'updateSetting' | 'loadSettings'>;

const defaultSettings: SettingsValues = {
  soundEnabled: true,
  notificationsEnabled: true,
  autostartEnabled: true,
  startMinimized: true,
  restoreOnLaunch: true,
  reduceMotion: false,
  highContrast: false,
  performanceMode: 'auto',
  globalShortcut: 'CommandOrControl+Shift+Space',
  syncEnabled: true,
  privacyTelemetryEnabled: false,
  setSelectedSceneOnApp: null,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...defaultSettings,
  updateSetting: (key, value) => set((s) => ({ ...s, [key]: value })),
  loadSettings: (settings) => set((s) => ({ ...s, ...settings })),
}));

// ─── Overlay Store ─────────────────────────────────────────
interface OverlayState {
  isOverlayVisible: boolean;
  overlayOpacity: number;
  accentColor: string;
  particlesEnabled: boolean;
  glowEnabled: boolean;
  vignetteEnabled: boolean;
  gradientEnabled: boolean;
  animationIntensity: 'off' | 'low' | 'medium' | 'high';
  transitionProgress: number;
  setOverlayVisible: (visible: boolean) => void;
  setOverlayOpacity: (opacity: number) => void;
  setAccentColor: (color: string) => void;
  setParticlesEnabled: (enabled: boolean) => void;
  setGlowEnabled: (enabled: boolean) => void;
  setVignetteEnabled: (enabled: boolean) => void;
  setGradientEnabled: (enabled: boolean) => void;
  setAnimationIntensity: (intensity: 'off' | 'low' | 'medium' | 'high') => void;
  setTransitionProgress: (progress: number) => void;
  applySceneVisuals: (scene: Scene) => void;
}

export const useOverlayStore = create<OverlayState>((set) => ({
  isOverlayVisible: true,
  overlayOpacity: 0.15,
  accentColor: '#ff6363',
  particlesEnabled: true,
  glowEnabled: true,
  vignetteEnabled: true,
  gradientEnabled: false,
  animationIntensity: 'medium',
  transitionProgress: 0,
  setOverlayVisible: (visible) => set({ isOverlayVisible: visible }),
  setOverlayOpacity: (opacity) => set({ overlayOpacity: opacity }),
  setAccentColor: (color) => set({ accentColor: color }),
  setParticlesEnabled: (enabled) => set({ particlesEnabled: enabled }),
  setGlowEnabled: (enabled) => set({ glowEnabled: enabled }),
  setVignetteEnabled: (enabled) => set({ vignetteEnabled: enabled }),
  setGradientEnabled: (enabled) => set({ gradientEnabled: enabled }),
  setAnimationIntensity: (intensity) => set({ animationIntensity: intensity }),
  setTransitionProgress: (progress) => set({ transitionProgress: progress }),
  applySceneVisuals: (scene) => {
    const visual = scene.visual;
    set({
      overlayOpacity: visual?.overlayOpacity ?? 0.15,
      accentColor: visual?.accentColor ?? '#ff6363',
      particlesEnabled: visual?.effects?.particles?.enabled ?? true,
      glowEnabled: visual?.effects?.glow?.enabled ?? true,
      vignetteEnabled: visual?.effects?.vignette?.enabled ?? true,
      gradientEnabled: visual?.effects?.gradient?.enabled ?? false,
      animationIntensity: scene.behavior?.animationIntensity ?? 'medium',
    });
  },
}));

// ─── Derived helpers ───────────────────────────────────────
export function getActiveScene(scenes: Scene[], activeSceneId: string | null): Scene | null {
  if (!activeSceneId) return null;
  return scenes.find((s) => s.id === activeSceneId) ?? null;
}

export function evaluateContextForRules(context: DesktopContext | null): RuleEvaluationContext | null {
  if (!context) return null;
  return {
    activeApplication: context.activeApplication?.name ?? null,
    activeWindowTitle: context.windowTitle,
    hour: context.hour,
    timeOfDay: context.timeOfDay,
    charging: context.charging,
    batteryLevel: context.battery?.level ?? 0,
    mediaPlaying: context.mediaState?.playing ?? false,
    mediaPlayer: context.mediaState?.player ?? null,
    idleSeconds: context.idleTimeSeconds,
    platform: context.platform,
    workspace: context.workspace,
    manualOverride: null,
  };
}

export { defaultSettings };

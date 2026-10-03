export type AnimationIntensity = 'off' | 'low' | 'medium' | 'high';

export interface WallpaperConfig {
  type: 'static' | 'gradient' | 'animated' | 'video' | 'shader';
  source?: string;
  colors?: [string, string, string?];
  transitionDurationMs?: number;
}

export interface SceneEffects {
  particles?: {
    enabled: boolean;
    type?: 'dust' | 'stars' | 'rain' | 'snow' | 'floating' | 'custom';
    density?: number;
    speed?: number;
    color?: string;
    size?: number;
    opacity?: number;
  };
  glow?: {
    enabled: boolean;
    color?: string;
    intensity?: number;
    radius?: number;
    position?: 'center' | 'cursor' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
  vignette?: {
    enabled: boolean;
    opacity?: number;
    color?: string;
    radius?: number;
  };
  gradient?: {
    enabled: boolean;
    colors: string[];
    angle?: number;
    speed?: number;
    mode?: 'static' | 'slow' | 'medium' | 'fast';
  };
}

export interface SceneVisual {
  wallpaper?: WallpaperConfig;
  backgroundTint?: string;
  overlayOpacity?: number;
  accentColor?: string;
  effects?: SceneEffects;
}

export interface SceneAudio {
  enabled: boolean;
  source?: string;
  volume?: number;
}

export interface WidgetConfig {
  id: string;
  type: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  size: 'small' | 'medium' | 'large';
  settings?: Record<string, unknown>;
  enabled?: boolean;
}

export interface SceneBehavior {
  animationIntensity: AnimationIntensity;
  reduceDistractions?: boolean;
  performanceMode?: 'performance' | 'balanced' | 'battery-saver' | 'auto';
}

export interface Scene {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  visual?: SceneVisual;
  audio?: SceneAudio;
  widgets?: WidgetConfig[];
  behavior?: SceneBehavior;
  isBuiltIn?: boolean;
  isFavorite?: boolean;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_SCENES: Scene[] = [
  {
    id: 'focus',
    name: 'Deep Focus',
    description: 'Minimal distractions for deep work',
    slug: 'deep-focus',
    visual: {
      backgroundTint: '#171719',
      overlayOpacity: 0.18,
      accentColor: '#ff6363',
      effects: {
        particles: { enabled: true, type: 'dust', density: 3, speed: 0.3, opacity: 0.4 },
        glow: { enabled: true, color: '#ff6363', intensity: 0.15, radius: 120 },
        vignette: { enabled: true, opacity: 0.25, color: '#0a0a0a' },
      },
    },
    behavior: { animationIntensity: 'low', reduceDistractions: true, performanceMode: 'balanced' },
    isBuiltIn: true,
    isFavorite: true,
  },
  {
    id: 'creative',
    name: 'Creative Flow',
    slug: 'creative-flow',
    visual: {
      backgroundTint: '#1a1a2e',
      overlayOpacity: 0.12,
      accentColor: '#a855f7',
      effects: {
        particles: { enabled: true, type: 'floating', density: 5, speed: 0.5, color: '#a855f7', opacity: 0.5 },
        glow: { enabled: true, color: '#a855f7', intensity: 0.2, radius: 150 },
      },
    },
    behavior: { animationIntensity: 'medium', reduceDistractions: false, performanceMode: 'performance' },
    isBuiltIn: true,
    isFavorite: true,
  },
  {
    id: 'music',
    name: 'Music',
    slug: 'music',
    visual: {
      backgroundTint: '#1a1a1a',
      overlayOpacity: 0.15,
      accentColor: '#ff6363',
      effects: {
        particles: { enabled: true, type: 'dust', density: 4, speed: 0.4, opacity: 0.35 },
        glow: { enabled: true, color: '#ff6363', intensity: 0.25, radius: 200 },
      },
    },
    audio: { enabled: true, volume: 0.5 },
    behavior: { animationIntensity: 'medium', performanceMode: 'balanced' },
    isBuiltIn: true,
    isFavorite: true,
  },
  {
    id: 'gaming',
    name: 'Gaming',
    slug: 'gaming',
    visual: { backgroundTint: '#0a0a0a', overlayOpacity: 0.05, accentColor: '#22c55e' },
    behavior: { animationIntensity: 'off', reduceDistractions: true, performanceMode: 'performance' },
    isBuiltIn: true,
  },
  {
    id: 'chill',
    name: 'Chill',
    slug: 'chill',
    visual: {
      backgroundTint: '#2a1f1f',
      overlayOpacity: 0.1,
      accentColor: '#f2c94c',
      effects: {
        gradient: { enabled: true, colors: ['#ff6363', '#ff4f91', '#a855f7'], angle: 135, mode: 'slow' },
        particles: { enabled: true, type: 'floating', density: 3, speed: 0.2, opacity: 0.3 },
      },
    },
    behavior: { animationIntensity: 'medium', performanceMode: 'balanced' },
    isBuiltIn: true,
    isFavorite: true,
  },
  {
    id: 'night',
    name: 'Night',
    slug: 'night',
    visual: {
      backgroundTint: '#12101a',
      overlayOpacity: 0.2,
      accentColor: '#f2c94c',
      effects: {
        glow: { enabled: true, color: '#f2c94c', intensity: 0.1, radius: 100 },
        vignette: { enabled: true, opacity: 0.35, color: '#050505' },
      },
    },
    behavior: { animationIntensity: 'low', reduceDistractions: true, performanceMode: 'battery-saver' },
    isBuiltIn: true,
  },
];

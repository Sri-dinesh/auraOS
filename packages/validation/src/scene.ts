import { z } from 'zod';

export const wallpaperConfigSchema = z.object({
  type: z.enum(['static', 'gradient', 'animated', 'video', 'shader']),
  source: z.string().optional(),
  colors: z.tuple([z.string(), z.string(), z.string().optional()]).optional(),
  transitionDurationMs: z.number().min(0).max(10000).optional(),
});

export const particleConfigSchema = z.object({
  enabled: z.boolean(),
  type: z.enum(['dust', 'stars', 'rain', 'snow', 'floating', 'custom']).optional(),
  density: z.number().min(0).max(20).optional(),
  speed: z.number().min(0).max(5).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  size: z.number().min(0.5).max(20).optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const glowConfigSchema = z.object({
  enabled: z.boolean(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  intensity: z.number().min(0).max(1).optional(),
  radius: z.number().min(0).max(500).optional(),
  position: z.enum(['center', 'cursor', 'top-left', 'top-right', 'bottom-left', 'bottom-right']).optional(),
});

export const vignetteConfigSchema = z.object({
  enabled: z.boolean(),
  opacity: z.number().min(0).max(1).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  radius: z.number().min(0).max(1).optional(),
});

export const gradientConfigSchema = z.object({
  enabled: z.boolean(),
  colors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(2).max(6),
  angle: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).max(10).optional(),
  mode: z.enum(['static', 'slow', 'medium', 'fast']).optional(),
});

export const sceneEffectsSchema = z.object({
  particles: particleConfigSchema.optional(),
  glow: glowConfigSchema.optional(),
  vignette: vignetteConfigSchema.optional(),
  gradient: gradientConfigSchema.optional(),
});

export const sceneVisualSchema = z.object({
  wallpaper: wallpaperConfigSchema.optional(),
  backgroundTint: z.string().regex(/^#[0-9a-fA-F]{6,8}$/).optional(),
  overlayOpacity: z.number().min(0).max(1).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6,8}$/).optional(),
  effects: sceneEffectsSchema.optional(),
});

export const sceneAudioSchema = z.object({
  enabled: z.boolean(),
  source: z.string().optional(),
  volume: z.number().min(0).max(1).optional(),
});

export const widgetConfigSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']),
  size: z.enum(['small', 'medium', 'large']),
  settings: z.record(z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

export const sceneBehaviorSchema = z.object({
  animationIntensity: z.enum(['off', 'low', 'medium', 'high']),
  reduceDistractions: z.boolean().optional(),
  performanceMode: z.enum(['performance', 'balanced', 'battery-saver', 'auto']).optional(),
});

export const sceneSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(64),
  description: z.string().max(256).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  visual: sceneVisualSchema.optional(),
  audio: sceneAudioSchema.optional(),
  widgets: z.array(widgetConfigSchema).optional(),
  behavior: sceneBehaviorSchema.optional(),
  isBuiltIn: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  version: z.number().int().min(1).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const sceneCreateSchema = sceneSchema.partial({
  id: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  version: true,
}).merge(z.object({
  id: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
}));

export const sceneUpdateSchema = sceneSchema.partial();

export type SceneFormData = z.infer<typeof sceneSchema>;
export type SceneCreateData = z.infer<typeof sceneCreateSchema>;
export type SceneUpdateData = z.infer<typeof sceneUpdateSchema>;

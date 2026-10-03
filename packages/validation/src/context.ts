import { z } from 'zod';

export const applicationInfoSchema = z.object({
  name: z.string(),
  executable: z.string(),
  windowTitle: z.string().nullable(),
  pid: z.number().int().positive(),
  workspace: z.number().int().nonnegative().optional(),
});

export const batteryStateSchema = z.object({
  level: z.number().min(0).max(100),
  charging: z.boolean(),
  pluggedIn: z.boolean(),
});

export const mediaStateSchema = z.object({
  playing: z.boolean(),
  player: z.string().nullable(),
  title: z.string().nullable(),
  artist: z.string().nullable(),
  album: z.string().nullable(),
  artworkUrl: z.string().nullable(),
});

export const timeOfDaySchema = z.enum(['morning', 'afternoon', 'evening', 'night']);

export const desktopContextSchema = z.object({
  activeApplication: applicationInfoSchema.nullable(),
  windowTitle: z.string().nullable(),
  timestamp: z.number().int().positive(),
  battery: batteryStateSchema.nullable(),
  charging: z.boolean(),
  mediaState: mediaStateSchema.nullable(),
  idleTimeSeconds: z.number().int().nonnegative(),
  platform: z.enum(['windows', 'linux', 'macos']),
  workspace: z.number().int().nonnegative(),
  timeOfDay: timeOfDaySchema,
  hour: z.number().int().min(0).max(23),
});

export const contextDebugInfoSchema = z.object({
  activeApplication: z.string().nullable(),
  batteryLevel: z.number().nullable(),
  charging: z.boolean().nullable(),
  mediaPlaying: z.boolean().nullable(),
  mediaPlayer: z.string().nullable(),
  idleSeconds: z.number().int().nonnegative(),
  timeOfDay: timeOfDaySchema.nullable(),
  hour: z.number().int().min(0).max(23),
  workspace: z.number().int().nonnegative(),
  platform: z.enum(['windows', 'linux', 'macos']),
});

export type DesktopContext = z.infer<typeof desktopContextSchema>;
export type ContextDebugInfo = z.infer<typeof contextDebugInfoSchema>;

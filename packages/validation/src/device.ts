import { z } from 'zod';

export const platformSchema = z.enum(['windows', 'linux', 'macos']);
export const architectureSchema = z.enum(['x86_64', 'aarch64', 'arm64']);

export const deviceInfoSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  deviceName: z.string().min(1).max(128),
  platform: platformSchema,
  architecture: architectureSchema,
  osVersion: z.string().max(128),
  appVersion: z.string().regex(/^\d+\.\d+\.\d+/),
  lastSeenAt: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const deviceRegistrationSchema = z.object({
  deviceName: z.string().min(1).max(128),
  platform: platformSchema,
  architecture: architectureSchema,
  osVersion: z.string().max(128),
  appVersion: z.string().regex(/^\d+\.\d+\.\d+/),
});

export type DeviceRegistrationPayload = z.infer<typeof deviceRegistrationSchema>;

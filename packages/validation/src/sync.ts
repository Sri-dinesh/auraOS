import { z } from 'zod';

export const syncObjectTypeSchema = z.enum(['scene', 'rule', 'preset', 'preference']);

export const syncEntitySchema = z.object({
  id: z.string(),
  type: syncObjectTypeSchema,
  version: z.number().int().positive(),
  updatedAt: z.string().datetime(),
  deviceId: z.string(),
  data: z.record(z.unknown()),
  deleted: z.boolean().optional(),
});

export const syncPushPayloadSchema = z.object({
  changes: z.array(syncEntitySchema),
  deviceId: z.string(),
  timestamp: z.number().int().positive(),
});

export const syncConflictSchema = z.object({
  id: z.string(),
  type: syncObjectTypeSchema,
  localVersion: z.number().int().positive(),
  remoteVersion: z.number().int().positive(),
  localData: z.record(z.unknown()),
  remoteData: z.record(z.unknown()),
  resolved: z.boolean().optional(),
});

export const syncPullResponseSchema = z.object({
  entities: z.array(syncEntitySchema),
  serverTimestamp: z.string().datetime(),
  conflicts: z.array(syncConflictSchema),
});

export type SyncEntity = z.infer<typeof syncEntitySchema>;
export type SyncPushPayload = z.infer<typeof syncPushPayloadSchema>;
export type SyncPullResponse = z.infer<typeof syncPullResponseSchema>;

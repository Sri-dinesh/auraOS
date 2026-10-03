import { sceneRepository } from '../scenes/scene.repository.js';
import { ruleRepository } from '../rules/rule.repository.js';
import { AppError } from '../../lib/errors.js';
import { syncPushPayloadSchema, type SyncPushPayload } from '@auraos/validation';

export const syncService = {
  async status(userId: string) {
    const scenes = await sceneRepository.listByUser(userId);
    const latest = scenes.reduce<Date | null>((acc, s) => {
      if (!acc || s.updatedAt > acc) return s.updatedAt;
      return acc;
    }, null);

    return {
      online: true,
      lastSyncAt: latest ? latest.toISOString() : null,
      pendingChanges: 0,
      deviceId: scenes[0]?.userId ?? null,
    };
  },

  /**
   * Applies a batch of device changes. Each entity is applied only when its
   * version is newer than the stored copy; otherwise it is reported back as a
   * conflict so the device can reconcile.
   */
  async push(userId: string, input: unknown) {
    const parsed = syncPushPayloadSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid sync payload', 400, {
        issues: parsed.error.flatten().fieldErrors,
      });
    }
    const payload = parsed.data as SyncPushPayload;

    let synced = 0;
    const conflicts: Array<Record<string, unknown>> = [];

    for (const change of payload.changes) {
      if (change.deviceId === payload.deviceId && change.type === 'scene') {
        const result = await sceneRepository.applyRemote({
          id: change.id,
          userId,
          slug: String(change.data.slug ?? change.id),
          name: String(change.data.name ?? 'Untitled'),
          version: change.version,
          updatedAt: change.updatedAt,
          deviceId: change.deviceId,
          payload: change.data as never,
        });

        if (result.status === 'applied') {
          synced += 1;
        } else {
          conflicts.push({ id: change.id, type: change.type, reason: result.reason });
        }
        continue;
      }

      conflicts.push({
        id: change.id,
        type: change.type,
        reason: 'unsupported sync object type',
      });
    }

    return { synced, conflicts, serverTimestamp: new Date().toISOString() };
  },

  async pull(userId: string, since?: string) {
    const sinceDate = since ? new Date(since) : new Date(0);
    if (Number.isNaN(sinceDate.getTime())) {
      throw new AppError('BAD_REQUEST', 'since must be a valid timestamp', 400);
    }

    const [scenes, rules] = await Promise.all([
      sceneRepository.findUpdatedSince(userId, sinceDate),
      ruleRepository.findUpdatedSince(userId, sinceDate),
    ]);

    const entities = [
      ...scenes.map((s) => ({
        id: s.id,
        type: 'scene' as const,
        version: s.version,
        updatedAt: s.updatedAt.toISOString(),
        deviceId: 'server',
        data: s as unknown as Record<string, unknown>,
      })),
      ...rules.map((r) => ({
        id: r.id,
        type: 'rule' as const,
        version: 1,
        updatedAt: r.updatedAt.toISOString(),
        deviceId: 'server',
        data: r as unknown as Record<string, unknown>,
      })),
    ];

    return {
      entities,
      serverTimestamp: new Date().toISOString(),
      conflicts: [],
    };
  },
};
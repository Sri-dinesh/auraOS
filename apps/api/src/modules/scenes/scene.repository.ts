import { prisma } from '../../lib/prisma.js';
import type { Prisma } from '@prisma/client';

export type SceneRecord = Prisma.SceneGetPayload<Record<string, never>>;

export const sceneRepository = {
  async listByUser(userId: string) {
    return prisma.scene.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async findById(id: string) {
    return prisma.scene.findUnique({ where: { id } });
  },

  async findBySlug(slug: string) {
    return prisma.scene.findUnique({ where: { slug } });
  },

  async create(data: Prisma.SceneCreateInput) {
    return prisma.scene.create({ data });
  },

  async update(id: string, data: Prisma.SceneUpdateInput) {
    return prisma.scene.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.scene.delete({ where: { id } });
  },

  async setFavorite(id: string, isFavorite: boolean) {
    return prisma.scene.update({
      where: { id },
      data: { isFavorite },
      select: { id: true, isFavorite: true },
    });
  },

  /**
   * Upserts a scene coming from a device sync push. The incoming version wins
   * only when it is newer than what we already have; otherwise we report a
   * conflict and leave the server copy untouched.
   */
  async applyRemote(scene: {
    id: string;
    userId: string;
    slug: string;
    name: string;
    version: number;
    updatedAt: string;
    deviceId: string;
    payload: Prisma.SceneUpdateInput;
  }): Promise<{ status: 'applied' | 'skipped'; reason?: string }> {
    const existing = await prisma.scene.findUnique({ where: { id: scene.id } });

    if (!existing) {
      await prisma.scene.create({
        data: {
          id: scene.id,
          userId: scene.userId,
          slug: scene.slug,
          name: scene.name,
          version: scene.version,
          updatedAt: new Date(scene.updatedAt),
          ...scene.payload,
        } as Prisma.SceneCreateInput,
      });
      return { status: 'applied' };
    }

    if (existing.version >= scene.version) {
      return { status: 'skipped', reason: 'remote version is not newer' };
    }

    await prisma.scene.update({
      where: { id: scene.id },
      data: { ...scene.payload, version: scene.version } as Prisma.SceneUpdateInput,
    });
    return { status: 'applied' };
  },

  async findUpdatedSince(userId: string, since: Date) {
    return prisma.scene.findMany({
      where: { userId, updatedAt: { gt: since } },
    });
  },
};
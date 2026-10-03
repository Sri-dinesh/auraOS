import { sceneRepository } from './scene.repository.js';
import { AppError } from '../../lib/errors.js';
import {
  sceneCreateSchema,
  sceneUpdateSchema,
  type SceneCreateData,
  type SceneUpdateData,
} from '@auraos/validation';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export const sceneService = {
  async list(userId: string) {
    return sceneRepository.listByUser(userId);
  },

  async get(userId: string, id: string) {
    const scene = await sceneRepository.findById(id);
    if (!scene) throw new AppError('NOT_FOUND', 'Scene not found', 404);
    if (scene.userId !== userId) {
      throw new AppError('FORBIDDEN', 'Scene belongs to another user', 403);
    }
    return scene;
  },

  async create(userId: string, input: unknown) {
    const parsed = sceneCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid scene payload', 400, {
        issues: parsed.error.flatten().fieldErrors,
      });
    }
    const data = parsed.data as SceneCreateData;

    const baseSlug = data.slug ?? (slugify(data.name) || 'scene');
    let slug = baseSlug;
    let suffix = 1;
    while (await sceneRepository.findBySlug(slug)) {
      slug = `${baseSlug}-${suffix++}`;
    }

    return sceneRepository.create({
      user: { connect: { id: userId } },
      name: data.name,
      slug,
      description: data.description,
      type: 'custom',
      visualConfig: (data.visual ?? undefined) as never,
      audioConfig: (data.audio ?? undefined) as never,
      widgetConfig: (data.widgets ?? undefined) as never,
      behaviorConfig: (data.behavior ?? undefined) as never,
    });
  },

  async update(userId: string, id: string, input: unknown) {
    await this.get(userId, id);

    const parsed = sceneUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid scene payload', 400, {
        issues: parsed.error.flatten().fieldErrors,
      });
    }
    const data = parsed.data as SceneUpdateData;

    const existing = await sceneRepository.findById(id);
    const isFavorite =
      data.isFavorite ?? existing?.isFavorite ?? false;

    return sceneRepository.update(id, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.visual !== undefined && { visualConfig: data.visual as never }),
      ...(data.audio !== undefined && { audioConfig: data.audio as never }),
      ...(data.widgets !== undefined && { widgetConfig: data.widgets as never }),
      ...(data.behavior !== undefined && { behaviorConfig: data.behavior as never }),
      isFavorite,
      version: { increment: 1 },
    });
  },

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await sceneRepository.delete(id);
  },

  async setFavorite(userId: string, id: string, isFavorite: boolean) {
    await this.get(userId, id);
    return sceneRepository.setFavorite(id, isFavorite);
  },
};
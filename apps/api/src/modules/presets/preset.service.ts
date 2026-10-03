import { presetRepository, type PresetVisibility } from './preset.repository.js';
import { AppError } from '../../lib/errors.js';
import { sceneSchema } from '@auraos/validation';

const VISIBILITIES: PresetVisibility[] = ['PRIVATE', 'BUILTIN', 'PUBLIC', 'UNLISTED'];

export const presetService = {
  async list(visibility?: string) {
    const resolved = (visibility as PresetVisibility) ?? 'BUILTIN';
    if (!VISIBILITIES.includes(resolved)) {
      throw new AppError('BAD_REQUEST', 'Unknown visibility', 400);
    }
    return presetRepository.list(resolved);
  },

  async get(id: string) {
    const preset = await presetRepository.findById(id);
    if (!preset) throw new AppError('NOT_FOUND', 'Preset not found', 404);
    return preset;
  },

  async download(id: string) {
    const preset = await presetRepository.findById(id);
    if (!preset) throw new AppError('NOT_FOUND', 'Preset not found', 404);

    // Presets must be storable as a Scene before a device can apply them.
    const parsed = sceneSchema.safeParse(preset.sceneConfig);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Preset contains an invalid scene config', 500);
    }

    await presetRepository.incrementDownloads(id);
    return { downloaded: true, sceneConfig: parsed.data };
  },

  async publish(userId: string, input: unknown) {
    const body = (input ?? {}) as { name?: string; description?: string; sceneConfig?: unknown };
    if (!body.name || !body.sceneConfig) {
      throw new AppError('BAD_REQUEST', 'name and sceneConfig are required', 400);
    }
    const scene = sceneSchema.safeParse(body.sceneConfig);
    if (!scene.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid scene config', 400, {
        issues: scene.error.flatten().fieldErrors,
      });
    }
    return presetRepository.create({
      authorId: userId,
      name: body.name,
      description: body.description,
      sceneConfig: scene.data,
    });
  },
};
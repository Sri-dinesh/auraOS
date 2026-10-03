import { ruleRepository } from './rule.repository.js';
import { sceneRepository } from '../scenes/scene.repository.js';
import { AppError } from '../../lib/errors.js';
import {
  ruleCreateSchema,
  ruleUpdateSchema,
  type RuleCreateData,
  type RuleUpdateData,
} from '@auraos/validation';

export const ruleService = {
  async list(userId: string) {
    return ruleRepository.listByUser(userId);
  },

  async get(userId: string, id: string) {
    const rule = await ruleRepository.findById(id);
    if (!rule) throw new AppError('NOT_FOUND', 'Rule not found', 404);
    if (rule.userId !== userId) {
      throw new AppError('FORBIDDEN', 'Rule belongs to another user', 403);
    }
    return rule;
  },

  async create(userId: string, input: unknown) {
    const parsed = ruleCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid rule payload', 400, {
        issues: parsed.error.flatten().fieldErrors,
      });
    }
    const data = parsed.data as RuleCreateData;

    // A rule must reference a scene the user actually owns.
    const sceneId = data.action.sceneId;
    if (!sceneId) {
      throw new AppError('VALIDATION_ERROR', 'Action requires a sceneId', 400);
    }
    const scene = await sceneRepository.findById(sceneId);
    if (!scene || scene.userId !== userId) {
      throw new AppError('VALIDATION_ERROR', 'Action references an unknown scene', 400);
    }

    return ruleRepository.create({
      scene: { connect: { id: sceneId } },
      user: { connect: { id: userId } },
      name: data.name,
      description: data.description,
      conditions: data.conditions as never,
      operator: data.conditionOperator,
      action: data.action as never,
      priority: data.priority,
      cooldownMs: data.cooldownMs,
      enabled: data.enabled,
    });
  },

  async update(userId: string, id: string, input: unknown) {
    await this.get(userId, id);

    const parsed = ruleUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid rule payload', 400, {
        issues: parsed.error.flatten().fieldErrors,
      });
    }
    const data = parsed.data as RuleUpdateData;

    if (data.action?.sceneId) {
      const scene = await sceneRepository.findById(data.action.sceneId);
      if (!scene || scene.userId !== userId) {
        throw new AppError('VALIDATION_ERROR', 'Action references an unknown scene', 400);
      }
    }

    return ruleRepository.update(id, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.conditions !== undefined && { conditions: data.conditions as never }),
      ...(data.conditionOperator !== undefined && { operator: data.conditionOperator }),
      ...(data.action !== undefined && { action: data.action as never }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.cooldownMs !== undefined && { cooldownMs: data.cooldownMs }),
      ...(data.enabled !== undefined && { enabled: data.enabled }),
    });
  },

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await ruleRepository.delete(id);
  },
};
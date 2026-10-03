import type { FastifyPluginAsync } from 'fastify';
import { ruleService } from './rule.service.js';
import { requireUserId } from '../../middleware/auth.js';
import { AppError } from '../../lib/errors.js';

export const rulesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request) => {
    return ruleService.list(requireUserId(request));
  });

  fastify.get<{ Params: { id: string } }>('/:id', async (request) => {
    try {
      return await ruleService.get(requireUserId(request), request.params.id);
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('INTERNAL_ERROR', 'Unexpected error', 500);
    }
  });

  fastify.post<{ Body: unknown }>('/', async (request, reply) => {
    try {
      const rule = await ruleService.create(requireUserId(request), request.body);
      return reply.status(201).send(rule);
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('INTERNAL_ERROR', 'Unexpected error', 500);
    }
  });

  fastify.patch<{ Params: { id: string }; Body: unknown }>('/:id', async (request) => {
    try {
      return await ruleService.update(requireUserId(request), request.params.id, request.body);
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('INTERNAL_ERROR', 'Unexpected error', 500);
    }
  });

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      await ruleService.remove(requireUserId(request), request.params.id);
      return reply.status(204).send();
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('INTERNAL_ERROR', 'Unexpected error', 500);
    }
  });
};
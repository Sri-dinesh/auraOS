import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { sceneService } from './scene.service.js';
import { requireUserId } from '../../middleware/auth.js';
import { AppError } from '../../lib/errors.js';

export const scenesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = requireUserId(request);
    return sceneService.list(userId);
  });

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const userId = requireUserId(request);
    try {
      return await sceneService.get(userId, request.params.id);
    } catch (err) {
      throw toHttpError(err);
    }
  });

  fastify.post<{ Body: unknown }>('/', async (request, reply) => {
    const userId = requireUserId(request);
    try {
      const scene = await sceneService.create(userId, request.body);
      return reply.status(201).send(scene);
    } catch (err) {
      throw toHttpError(err);
    }
  });

  fastify.patch<{ Params: { id: string }; Body: unknown }>('/:id', async (request, reply) => {
    const userId = requireUserId(request);
    try {
      return await sceneService.update(userId, request.params.id, request.body);
    } catch (err) {
      throw toHttpError(err);
    }
  });

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const userId = requireUserId(request);
    try {
      await sceneService.remove(userId, request.params.id);
      return reply.status(204).send();
    } catch (err) {
      throw toHttpError(err);
    }
  });

  fastify.patch<{ Params: { id: string }; Body: { isFavorite?: boolean } }>(
    '/:id/favorite',
    async (request, reply) => {
      const userId = requireUserId(request);
      const { isFavorite } = request.body ?? {};
      if (typeof isFavorite !== 'boolean') {
        throw new AppError('BAD_REQUEST', 'isFavorite must be a boolean', 400);
      }
      try {
        return await sceneService.setFavorite(userId, request.params.id, isFavorite);
      } catch (err) {
        throw toHttpError(err);
      }
    }
  );
};

function toHttpError(err: unknown): AppError {
  return err instanceof AppError ? err : new AppError('INTERNAL_ERROR', 'Unexpected error', 500);
}
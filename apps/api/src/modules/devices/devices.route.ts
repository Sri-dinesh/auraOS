import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { deviceService } from './device.service.js';
import { requireUserId } from '../../middleware/auth.js';
import { AppError } from '../../lib/errors.js';

export const devicesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return deviceService.list(requireUserId(request));
  });

  fastify.post<{ Body: unknown }>('/', async (request, reply) => {
    try {
      const device = await deviceService.register(requireUserId(request), request.body);
      return reply.status(201).send(device);
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('INTERNAL_ERROR', 'Unexpected error', 500);
    }
  });

  fastify.patch<{ Params: { id: string }; Body: { deviceName?: string } }>(
    '/:id',
    async (request, reply) => {
      try {
        return await deviceService.update(
          requireUserId(request),
          request.params.id,
          request.body?.deviceName,
        );
      } catch (err) {
        throw err instanceof AppError ? err : new AppError('INTERNAL_ERROR', 'Unexpected error', 500);
      }
    }
  );

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      await deviceService.remove(requireUserId(request), request.params.id);
      return reply.status(204).send();
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('INTERNAL_ERROR', 'Unexpected error', 500);
    }
  });
};
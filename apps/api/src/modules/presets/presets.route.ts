import type { FastifyPluginAsync } from 'fastify';
import { presetService } from './preset.service.js';
import { requireUserId } from '../../middleware/auth.js';
import { AppError } from '../../lib/errors.js';

function wrap<T>(fn: () => Promise<T>) {
  return fn().catch((err) => {
    throw err instanceof AppError ? err : new AppError('INTERNAL_ERROR', 'Unexpected error', 500);
  });
}

export const presetsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: { visibility?: string } }>('/', (request) =>
    wrap(() => presetService.list(request.query?.visibility)),
  );

  fastify.get<{ Params: { id: string } }>('/:id', (request) =>
    wrap(() => presetService.get(request.params.id)),
  );

  fastify.post<{ Params: { id: string } }>('/:id/download', (request) =>
    wrap(() => presetService.download(request.params.id)),
  );

  fastify.post<{ Body: unknown }>('/', (request, reply) =>
    wrap(async () => {
      const preset = await presetService.publish(requireUserId(request), request.body);
      return reply.status(201).send(preset);
    }),
  );
};
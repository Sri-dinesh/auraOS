import type { FastifyPluginAsync } from 'fastify';
import { syncService } from './sync.service.js';
import { requireUserId } from '../../middleware/auth.js';
import { AppError } from '../../lib/errors.js';

function wrap<T>(fn: () => Promise<T>) {
  return fn().catch((err) => {
    throw err instanceof AppError ? err : new AppError('INTERNAL_ERROR', 'Unexpected error', 500);
  });
}

export const syncRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', (request) => wrap(() => syncService.status(requireUserId(request))));

  fastify.post<{ Body: unknown }>('/push', (request) =>
    wrap(() => syncService.push(requireUserId(request), request.body)),
  );

  fastify.post<{ Body: { since?: string } }>('/pull', (request) =>
    wrap(() => syncService.pull(requireUserId(request), request.body?.since)),
  );
};
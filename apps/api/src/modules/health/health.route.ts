import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => ({
    status: 'ok',
    version: '0.1.0',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  }));
};
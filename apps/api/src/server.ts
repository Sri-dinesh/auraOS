import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { authPlugin } from './plugins/auth.js';
import { scenesRoutes } from './modules/scenes/scenes.route.js';
import { rulesRoutes } from './modules/rules/rules.route.js';
import { devicesRoutes } from './modules/devices/devices.route.js';
import { presetsRoutes } from './modules/presets/presets.route.js';
import { syncRoutes } from './modules/sync/sync.route.js';
import { usersRoutes } from './modules/users/users.route.js';
import { healthRoutes } from './modules/health/health.route.js';
import { errorHandler } from './lib/errors.js';
import { loggerOptions } from './lib/logger.js';

const fastify = Fastify({
  logger: loggerOptions(),
  requestTimeout: 10_000,
  bodyLimit: 1_048_576,
});

await fastify.register(cors, { origin: true, credentials: true });

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: (_request: unknown, context: { ttl: number }) => ({
    code: 'RATE_LIMITED',
    message: 'Too many requests, please try again later.',
    details: { retryAfter: context.ttl },
  }),
});

await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'AuraOS API',
      description: 'Cloud backend for AuraOS. The desktop app works fully offline; this service only handles accounts and sync.',
      version: '0.1.0',
    },
    servers: [{ url: process.env.API_URL ?? 'http://localhost:3000' }],
  },
});

await fastify.register(swaggerUi, {
  routePrefix: '/docs',
});

await fastify.register(authPlugin);

fastify.setErrorHandler(errorHandler);

// All routes live under /api/v1 (see plan section 38).
await fastify.register(healthRoutes, { prefix: '/api/v1/health' });
await fastify.register(usersRoutes, { prefix: '/api/v1/users' });
await fastify.register(scenesRoutes, { prefix: '/api/v1/scenes' });
await fastify.register(rulesRoutes, { prefix: '/api/v1/rules' });
await fastify.register(devicesRoutes, { prefix: '/api/v1/devices' });
await fastify.register(presetsRoutes, { prefix: '/api/v1/presets' });
await fastify.register(syncRoutes, { prefix: '/api/v1/sync' });

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

try {
  await fastify.listen({ port, host });
  fastify.log.info(`AuraOS API listening on http://${host}:${port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
import { fastifyPlugin } from 'fastify-plugin';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../lib/prisma.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * Mounts Better Auth and attaches the resolved `userId` to every request so
 * route handlers can rely on `requireUserId(request)`.
 */
export const authPlugin = fastifyPlugin(async (fastify) => {
  const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    trustedOrigins: [process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'],
    providers: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID ?? '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      },
    },
    emailAndPassword: { enabled: true },
    apiTokens: { enabled: true },
    session: { expiresIn: 1000 * 60 * 60 * 24 * 30 },
    // Privacy default: AuraOS never phones home from the API.
    telemetry: { enabled: false },
  });

  // Better Auth exposes a fetch-style handler; bridge Node's req/res to it.
  fastify.all('/auth/*', async (request, reply) => {
    const url = new URL(request.url, process.env.BETTER_AUTH_URL ?? 'http://localhost:3000');

    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value === undefined) continue;
      headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
    }

    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
    const body = hasBody ? JSON.stringify(request.body ?? {}) : undefined;

    const authRequest = new Request(url, {
      method: request.method,
      headers,
      ...(body ? { body } : {}),
    });

    const response = await auth.handler(authRequest);

    reply.status(response.status);
    response.headers.forEach((value, key) => reply.header(key, value));
    return response.body ? Buffer.from(await response.arrayBuffer()) : undefined;
  });

  fastify.decorateRequest('userId', undefined);
  fastify.decorateRequest('sessionId', undefined);

  fastify.addHook('onRequest', async (request) => {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (session?.user?.id) {
        const authed = request as AuthenticatedRequest;
        authed.userId = session.user.id;
        authed.sessionId = session.session.id;
      }
    } catch {
      // An invalid or absent session simply leaves the request unauthenticated.
    }
  });
});
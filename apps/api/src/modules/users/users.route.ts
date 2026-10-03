import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { requireUserId } from '../../middleware/auth.js';
import { AppError } from '../../lib/errors.js';

export const usersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/me', async (request) => {
    const userId = requireUserId(request);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true, createdAt: true },
    });
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);
    return user;
  });

  fastify.patch<{ Body: { name?: string; email?: string } }>('/me', async (request) => {
    const userId = requireUserId(request);
    const { name, email } = request.body ?? {};
    if (name === undefined && email === undefined) {
      throw new AppError('BAD_REQUEST', 'Nothing to update', 400);
    }

    try {
      return await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined && { name }),
          ...(email !== undefined && { email }),
        },
        select: { id: true, name: true, email: true, image: true },
      });
    } catch {
      // Most likely a unique-constraint violation on email.
      throw new AppError('CONFLICT', 'Email already in use', 409);
    }
  });
};
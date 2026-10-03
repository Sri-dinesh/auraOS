import type { FastifyRequest } from 'fastify';
import { AppError } from '../lib/errors.js';

export interface AuthenticatedRequest extends FastifyRequest {
  userId?: string;
  sessionId?: string;
}

/**
 * Reads the user id attached to the request by the auth plugin.
 * Throws 401 when the request is not authenticated — callers never need to
 * null-check the result.
 */
export function requireUserId(request: FastifyRequest): string {
  const userId = (request as AuthenticatedRequest).userId;
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }
  return userId;
}

export function optionalUserId(request: FastifyRequest): string | null {
  return (request as AuthenticatedRequest).userId ?? null;
}
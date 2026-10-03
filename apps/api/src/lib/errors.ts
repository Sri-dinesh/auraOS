import { FastifyPluginAsync, type FastifyRequest, type FastifyReply } from 'fastify';

export type ApiErrorCode =
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'PLATFORM_UNSUPPORTED'
  | 'PERMISSION_DENIED';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export class AppError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return;
  }

  const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
  const message = statusCode === 500
    ? 'Internal server error'
    : (error as Error).message ?? 'Unknown error';

  request.log.error({ err: error, requestId: request.id }, 'Unhandled error');

  reply.status(statusCode).send({
    code: statusCode === 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST',
    message,
  });
}

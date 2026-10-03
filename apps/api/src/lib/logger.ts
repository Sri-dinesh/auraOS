import type { FastifyServerOptions } from 'fastify';

/**
 * Pino options for the Fastify logger.
 *
 * Fastify builds the logger instance itself, so this returns configuration
 * rather than a constructed logger — passing an instance makes Fastify throw
 * `FST_ERR_LOG_INVALID_LOGGER_CONFIG` at startup.
 */
export function loggerOptions(): FastifyServerOptions['logger'] {
  const isPretty = process.env.NODE_ENV === 'development' && process.env.NO_PRETTY !== '1';

  return {
    level: process.env.LOG_LEVEL ?? 'info',
    ...(isPretty
      ? {
          transport: {
            target: 'pino-pretty',
            options: { translateTime: 'SYS:standard', ignore: 'pid,hostname' },
          },
        }
      : {}),
  };
}
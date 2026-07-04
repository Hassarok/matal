import type { Env } from './env.validation';

/**
 * Shapes validated environment variables into a structured, strongly-typed
 * configuration tree. Access via `ConfigService.get('app.port')`, etc.
 */
export interface AppConfig {
  env: Env['NODE_ENV'];
  app: {
    port: number;
    globalPrefix: string;
    corsOrigins: string[];
  };
  database: {
    url: string;
  };
  redis: {
    url: string | null;
    enabled: boolean;
  };
}

export function buildConfig(env: Env): AppConfig {
  return {
    env: env.NODE_ENV,
    app: {
      port: env.API_PORT,
      globalPrefix: env.API_GLOBAL_PREFIX,
      corsOrigins: env.CORS_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    },
    database: {
      url: env.DATABASE_URL,
    },
    redis: {
      url: env.REDIS_URL ?? null,
      enabled: Boolean(env.REDIS_URL),
    },
  };
}

import type { Env } from './env.validation';

/**
 * Shapes validated environment variables into a structured, strongly-typed
 * configuration tree. Access via `ConfigService.get('auth.accessSecret')`, etc.
 */
export interface AppConfig {
  env: Env['NODE_ENV'];
  app: {
    port: number;
    globalPrefix: string;
    corsOrigins: string[];
    webAppUrl: string;
  };
  database: {
    url: string;
  };
  redis: {
    url: string | null;
    enabled: boolean;
  };
  auth: {
    accessSecret: string;
    refreshSecret: string;
    accessTtlSeconds: number;
    refreshTtlSeconds: number;
    verificationTtlSeconds: number;
    resetTtlSeconds: number;
  };
  cookies: {
    secure: boolean;
    domain: string | undefined;
  };
  email: {
    from: string;
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
      webAppUrl: env.WEB_APP_URL,
    },
    database: {
      url: env.DATABASE_URL,
    },
    redis: {
      url: env.REDIS_URL ?? null,
      enabled: Boolean(env.REDIS_URL),
    },
    auth: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessTtlSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
      refreshTtlSeconds: env.REFRESH_TOKEN_TTL_SECONDS,
      verificationTtlSeconds: env.VERIFICATION_TOKEN_TTL_SECONDS,
      resetTtlSeconds: env.RESET_TOKEN_TTL_SECONDS,
    },
    cookies: {
      secure: env.COOKIE_SECURE,
      domain: env.COOKIE_DOMAIN,
    },
    email: {
      from: env.EMAIL_FROM,
    },
  };
}

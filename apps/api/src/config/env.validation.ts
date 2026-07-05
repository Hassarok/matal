import { z } from 'zod';

/**
 * Validates and normalises `process.env` at boot. If a required variable is
 * missing or malformed the application fails fast with a clear message,
 * rather than crashing later with an obscure runtime error.
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    API_PORT: z.coerce.number().int().positive().default(3000),
    API_GLOBAL_PREFIX: z.string().default('api'),

    // Comma-separated origins → parsed into an array by `configuration.ts`.
    CORS_ORIGINS: z.string().default('http://localhost:5173'),

    // Public URL of the web app — used to build email links (verify/reset).
    WEB_APP_URL: z.string().url().default('http://localhost:5173'),

    DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string.'),

    // Optional — the app runs without Redis in development.
    REDIS_URL: z.string().url().optional(),

    // ── Auth / JWT ──────────────────────────────────────────────────
    JWT_ACCESS_SECRET: z
      .string()
      .min(16, 'JWT_ACCESS_SECRET must be at least 16 characters.')
      .default('dev-access-secret-change-me-please'),
    JWT_REFRESH_SECRET: z
      .string()
      .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters.')
      .default('dev-refresh-secret-change-me-please'),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900), // 15m
    REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(604800), // 7d
    VERIFICATION_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(86400), // 1d
    RESET_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(3600), // 1h

    // ── Cookies ─────────────────────────────────────────────────────
    COOKIE_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
    COOKIE_DOMAIN: z.string().optional(),

    // ── Email ───────────────────────────────────────────────────────
    EMAIL_FROM: z.string().default('MATAL <no-reply@matal.dev>'),
  })
  .superRefine((env, ctx) => {
    // Never allow the insecure development secrets in production.
    if (env.NODE_ENV === 'production') {
      for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
        if (env[key].startsWith('dev-')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} must be set to a strong secret in production.`,
          });
        }
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

/**
 * Consumed by `ConfigModule.forRoot({ validate })`.
 * Throws a readable aggregated error when validation fails.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}

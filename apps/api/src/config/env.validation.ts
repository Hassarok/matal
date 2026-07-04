import { z } from 'zod';

/**
 * Validates and normalises `process.env` at boot. If a required variable is
 * missing or malformed the application fails fast with a clear message,
 * rather than crashing later with an obscure runtime error.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  API_PORT: z.coerce.number().int().positive().default(3000),
  API_GLOBAL_PREFIX: z.string().default('api'),

  // Comma-separated origins → parsed into an array by `configuration.ts`.
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid connection string.'),

  // Optional — the app runs without Redis in development.
  REDIS_URL: z.string().url().optional(),
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

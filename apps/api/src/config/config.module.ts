import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { join } from 'node:path';
import { validateEnv } from './env.validation';
import { buildConfig } from './configuration';

/**
 * Global configuration module.
 *
 * Loads the shared root `.env` (used by both the API and the web app) and
 * validates it via Zod before the rest of the application boots. Exposes a
 * structured, strongly-typed config tree through Nest's `ConfigService`.
 */
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Prefer the repo-root .env; fall back to a local one if present.
      envFilePath: [
        join(process.cwd(), '../../.env'),
        join(process.cwd(), '.env'),
      ],
      load: [() => buildConfig(validateEnv(process.env))],
    }),
  ],
})
export class AppConfigModule {}

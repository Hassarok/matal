import { Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  const config = app.get(ConfigService<AppConfig, true>);
  const port = config.get('app.port', { infer: true });
  const globalPrefix = config.get('app.globalPrefix', { infer: true });
  const corsOrigins = config.get('app.corsOrigins', { infer: true });

  // ── Security headers ──────────────────────────────────────────────
  app.use(helmet());

  // ── CORS (credentialed, explicit allow-list) ──────────────────────
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // ── Routing: /api  +  URI versioning (/v1) ────────────────────────
  app.setGlobalPrefix(globalPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // ── Cross-cutting request/response handling ───────────────────────
  // Request validation is handled per-route with Zod (`ZodValidationPipe`)
  // using the shared schemas from @matal/validation — no class-validator.
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Graceful shutdown (flush DB connections, etc.)
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(
    `MATAL API ready → http://localhost:${port}/${globalPrefix}/v1/health`,
  );
}

void bootstrap();

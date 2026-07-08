import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma.module';
import { SecurityModule } from './modules/security/security.module';
import { EmailModule } from './modules/email/email.module';
import { StorageModule } from './modules/storage/storage.module';
import { AuthSecurityModule } from './modules/auth/auth-security.module';
import { AiModule } from './modules/ai/ai.module';
import { HealthModule } from './modules/health/health.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { GamesModule } from './modules/games/games.module';
import { AdminModule } from './modules/admin/admin.module';

/**
 * Application composition root.
 *
 * Global infrastructure modules (config, database, security, email, auth
 * primitives, AI seam) are imported once here; feature modules are added as
 * the platform grows. Each feature follows Clean Architecture —
 * controllers/gateways → services → repositories.
 */
@Module({
  imports: [
    // Infrastructure / cross-cutting
    AppConfigModule,
    PrismaModule,
    SecurityModule,
    EmailModule,
    StorageModule,
    AuthSecurityModule,
    AiModule,
    // Global rate limiting: 100 requests / minute per IP by default;
    // sensitive auth routes tighten this with @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Features
    HealthModule,
    RealtimeModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    QuizzesModule,
    GamesModule,
    AdminModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

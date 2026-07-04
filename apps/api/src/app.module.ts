import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma.module';
import { AiModule } from './modules/ai/ai.module';
import { HealthModule } from './modules/health/health.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

/**
 * Application composition root.
 *
 * Global infrastructure modules (config, database, AI seam) are imported once
 * here; feature modules are added as the platform grows (auth, quizzes, games,
 * reports, admin…). Each feature lives in its own module following Clean
 * Architecture — controllers/gateways → services → repositories.
 */
@Module({
  imports: [
    // Infrastructure / cross-cutting
    AppConfigModule,
    PrismaModule,
    AiModule,

    // Features
    HealthModule,
    RealtimeModule,
  ],
})
export class AppModule {}

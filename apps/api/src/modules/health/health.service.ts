import { Injectable } from '@nestjs/common';
import type { HealthStatus } from '@matal/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { APP_VERSION } from '../../common/version';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    const databaseUp = await this.prisma.isHealthy();

    return {
      status: databaseUp ? 'ok' : 'degraded',
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      services: {
        database: databaseUp ? 'up' : 'down',
      },
    };
  }
}

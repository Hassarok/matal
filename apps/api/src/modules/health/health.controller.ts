import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from '@matal/shared-types';
import { HealthService } from './health.service';

/**
 * Liveness/readiness endpoint. Consumed by the web client (to prove
 * connectivity) and by container orchestration / uptime monitors.
 *
 * Route: GET /api/v1/health
 */
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check(): Promise<HealthStatus> {
    return this.healthService.check();
  }
}

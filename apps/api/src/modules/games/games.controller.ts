import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  paginationQuerySchema,
  type PaginationQuery,
} from '@matal/validation';
import type {
  GameReport,
  GameSummary,
  HostAnalytics,
  Paginated,
} from '@matal/shared-types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { GamesService } from './games.service';

/**
 * Read access to a host's completed games. Live gameplay runs over the
 * Socket.IO gateway; this REST surface serves history for the dashboard and
 * (later) reports. Routes: /api/v1/games …
 */
@Controller({ path: 'games', version: '1' })
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('history')
  history(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery,
  ): Promise<Paginated<GameSummary>> {
    return this.gamesService.history(user.id, query);
  }

  @Get('analytics')
  analytics(@CurrentUser() user: AuthenticatedUser): Promise<HostAnalytics> {
    return this.gamesService.analytics(user.id);
  }

  @Get(':id/report')
  report(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<GameReport> {
    return this.gamesService.report(user.id, id);
  }
}

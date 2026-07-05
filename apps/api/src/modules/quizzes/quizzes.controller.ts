import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  quizListQuerySchema,
  saveQuizSchema,
  type QuizListQuery,
  type SaveQuizInput,
} from '@matal/validation';
import type { Paginated, QuizDetail, QuizListItem } from '@matal/shared-types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { QuizzesService } from './quizzes.service';

/**
 * Quiz authoring. All routes are owner-scoped and require authentication.
 * Routes: /api/v1/quizzes …
 */
@Controller({ path: 'quizzes', version: '1' })
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(quizListQuerySchema)) query: QuizListQuery,
  ): Promise<Paginated<QuizListItem>> {
    return this.quizzesService.list(user.id, query);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(saveQuizSchema)) dto: SaveQuizInput,
  ): Promise<QuizDetail> {
    return this.quizzesService.create(user.id, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<QuizDetail> {
    return this.quizzesService.findOne(user.id, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(saveQuizSchema)) dto: SaveQuizInput,
  ): Promise<QuizDetail> {
    return this.quizzesService.update(user.id, id, dto);
  }

  @Post(':id/duplicate')
  duplicate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<QuizDetail> {
    return this.quizzesService.duplicate(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.quizzesService.remove(user.id, id);
  }
}

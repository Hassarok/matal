import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  adminListQuerySchema,
  updateUserRoleSchema,
  type AdminListQuery,
  type UpdateUserRoleInput,
} from '@matal/validation';
import {
  UserRole,
  type AdminQuizItem,
  type AdminStats,
  type AdminUser,
  type Paginated,
} from '@matal/shared-types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AdminService } from './admin.service';

/**
 * Admin-only platform management. Every route requires an authenticated ADMIN.
 * Routes: /api/v1/admin …
 */
@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  stats(): Promise<AdminStats> {
    return this.adminService.stats();
  }

  @Get('users')
  listUsers(
    @Query(new ZodValidationPipe(adminListQuerySchema)) query: AdminListQuery,
  ): Promise<Paginated<AdminUser>> {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserRoleSchema)) dto: UpdateUserRoleInput,
  ): Promise<AdminUser> {
    return this.adminService.updateUserRole(actor.id, id, dto.role);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.adminService.deleteUser(actor.id, id);
  }

  @Get('quizzes')
  listQuizzes(
    @Query(new ZodValidationPipe(adminListQuerySchema)) query: AdminListQuery,
  ): Promise<Paginated<AdminQuizItem>> {
    return this.adminService.listQuizzes(query);
  }

  @Delete('quizzes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuiz(@Param('id') id: string): Promise<void> {
    await this.adminService.deleteQuiz(id);
  }
}

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from '@matal/validation';
import type { MessageResponse, PublicUser } from '@matal/shared-types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UsersService } from './users.service';

/**
 * Current-user profile management. Routes: /api/v1/users/me …
 * All routes require authentication.
 */
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileInput,
  ): Promise<PublicUser> {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(changePasswordSchema)) dto: ChangePasswordInput,
  ): Promise<MessageResponse> {
    await this.usersService.changePassword(user.id, dto.currentPassword, dto.newPassword);
    return { message: 'Your password has been changed.' };
  }
}

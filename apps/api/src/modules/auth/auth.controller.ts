import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type LoginInput,
  type RegisterInput,
  type RequestPasswordResetInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from '@matal/validation';
import type { MessageResponse, SessionResponse } from '@matal/shared-types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { AuthCookieService } from './auth-cookie.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { GUEST_COOKIE, REFRESH_COOKIE, type AuthenticatedUser } from './auth.types';
import { UsersService } from '../users/users.service';

/** Rate limit for sensitive auth actions: 5 requests / minute per IP. */
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookies: AuthCookieService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @Throttle(AUTH_THROTTLE)
  async register(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionResponse> {
    const { user, accessToken, refreshToken } = await this.authService.register(dto);
    this.cookies.setAuthCookies(res, accessToken, refreshToken);
    this.cookies.clearGuestCookie(res);
    return { user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionResponse> {
    const { user, accessToken, refreshToken } = await this.authService.login(dto);
    this.cookies.setAuthCookies(res, accessToken, refreshToken);
    this.cookies.clearGuestCookie(res);
    return { user };
  }

  /**
   * Ensures the caller has an anonymous guest session (idempotent). Lets a
   * visitor host live games and be identified across reconnects without an
   * account. Reuses an existing valid guest cookie; otherwise mints one.
   */
  @Post('guest')
  @HttpCode(HttpStatus.OK)
  async guest(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ guestId: string }> {
    const raw = req.cookies?.[GUEST_COOKIE] as string | undefined;
    const { guestId, token } = await this.authService.ensureGuest(raw);
    if (token) this.cookies.setGuestCookie(res, token);
    return { guestId };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionResponse> {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const { user, accessToken, refreshToken } = await this.authService.refresh(raw);
    this.cookies.setAuthCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MessageResponse> {
    await this.authService.logout(req.cookies?.[REFRESH_COOKIE] as string | undefined);
    this.cookies.clearAuthCookies(res);
    return { message: 'You have been signed out.' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser): Promise<SessionResponse> {
    return { user: await this.usersService.getPublicById(user.id) };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body(new ZodValidationPipe(verifyEmailSchema)) dto: VerifyEmailInput,
  ): Promise<MessageResponse> {
    await this.authService.verifyEmail(dto.token);
    return { message: 'Your email has been verified.' };
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  async requestPasswordReset(
    @Body(new ZodValidationPipe(requestPasswordResetSchema))
    dto: RequestPasswordResetInput,
  ): Promise<MessageResponse> {
    await this.authService.requestPasswordReset(dto.email);
    return {
      message: 'If an account exists for that email, a reset link has been sent.',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) dto: ResetPasswordInput,
  ): Promise<MessageResponse> {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Your password has been reset. You can now sign in.' };
  }
}

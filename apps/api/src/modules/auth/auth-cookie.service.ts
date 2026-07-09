import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import type { AppConfig } from '../../config/configuration';
import {
  ACCESS_COOKIE,
  GUEST_COOKIE,
  GUEST_TOKEN_TTL_SECONDS,
  REFRESH_COOKIE,
} from './auth.types';

/**
 * Centralises auth cookie handling. Tokens are stored in httpOnly cookies
 * (invisible to JS → XSS-resistant) with SameSite=Lax (CSRF-resistant for our
 * same-site SPA). The refresh cookie is scoped to the auth path so it is only
 * sent where it is needed.
 */
@Injectable()
export class AuthCookieService {
  private readonly refreshPath: string;

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    const prefix = this.config.get('app.globalPrefix', { infer: true });
    this.refreshPath = `/${prefix}/v1/auth`;
  }

  private baseOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('cookies.secure', { infer: true }),
      domain: this.config.get('cookies.domain', { infer: true }),
    };
  }

  setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const base = this.baseOptions();
    res.cookie(ACCESS_COOKIE, accessToken, {
      ...base,
      path: '/',
      maxAge: this.config.get('auth.accessTtlSeconds', { infer: true }) * 1000,
    });
    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...base,
      path: this.refreshPath,
      maxAge: this.config.get('auth.refreshTtlSeconds', { infer: true }) * 1000,
    });
  }

  clearAuthCookies(res: Response): void {
    const { domain } = this.baseOptions();
    res.clearCookie(ACCESS_COOKIE, { path: '/', domain });
    res.clearCookie(REFRESH_COOKIE, { path: this.refreshPath, domain });
  }

  /**
   * Stores a guest token in a long-lived httpOnly cookie. Separate from the
   * access cookie so guests never satisfy the real-user JWT guard, yet the game
   * gateway can still resolve a stable host identity from the handshake.
   */
  setGuestCookie(res: Response, guestToken: string): void {
    res.cookie(GUEST_COOKIE, guestToken, {
      ...this.baseOptions(),
      path: '/',
      maxAge: GUEST_TOKEN_TTL_SECONDS * 1000,
    });
  }

  clearGuestCookie(res: Response): void {
    const { domain } = this.baseOptions();
    res.clearCookie(GUEST_COOKIE, { path: '/', domain });
  }
}

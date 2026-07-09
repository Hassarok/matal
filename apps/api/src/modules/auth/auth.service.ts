import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenType, type Token, type User } from '@prisma/client';
import type { PublicUser } from '@matal/shared-types';
import type { LoginInput, RegisterInput } from '@matal/validation';
import { PrismaService } from '../../database/prisma.service';
import { PasswordService } from '../security/password.service';
import { EmailService } from '../email/email.service';
import { randomUUID } from 'node:crypto';
import { randomToken, sha256 } from '../../common/hash.util';
import type { AppConfig } from '../../config/configuration';
import { toPublicUser } from '../users/user.mapper';
import {
  GUEST_TOKEN_TTL_SECONDS,
  type GuestJwtPayload,
  type JwtPayload,
} from './auth.types';

/** Result of a successful auth operation — cookies are set by the controller. */
export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  // ── Registration & login ──────────────────────────────────────────

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }] },
      select: { email: true, username: true },
    });
    if (existing) {
      throw new ConflictException(
        existing.email === input.email
          ? 'An account with this email already exists.'
          : 'That username is already taken.',
      );
    }

    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        displayName: input.displayName,
        passwordHash,
      },
    });

    await this.sendVerificationEmail(user);
    return this.issueSession(user);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    // Same generic message whether the email or the password is wrong, to
    // avoid revealing which accounts exist.
    const invalid = new UnauthorizedException('Invalid email or password.');
    if (!user) throw invalid;

    const ok = await this.passwords.verify(user.passwordHash, input.password);
    if (!ok) throw invalid;

    return this.issueSession(user);
  }

  // ── Guest (anonymous) sessions ────────────────────────────────────

  /**
   * Resolves a stable guest identity. If a valid guest token is presented it is
   * reused (so identity survives reloads); otherwise a fresh one is minted.
   * Returns `token` only when a new token was issued — the caller sets the
   * cookie in that case.
   */
  async ensureGuest(
    rawGuestToken: string | undefined,
  ): Promise<{ guestId: string; token: string | null }> {
    if (rawGuestToken) {
      try {
        const payload = await this.jwt.verifyAsync<GuestJwtPayload>(rawGuestToken);
        if (payload.guest && payload.sub) {
          return { guestId: payload.sub, token: null };
        }
      } catch {
        // Fall through and mint a new token.
      }
    }
    const guestId = randomUUID();
    const token = await this.jwt.signAsync(
      { sub: guestId, guest: true } satisfies GuestJwtPayload,
      { expiresIn: GUEST_TOKEN_TTL_SECONDS },
    );
    return { guestId, token };
  }

  // ── Session lifecycle ─────────────────────────────────────────────

  async refresh(rawRefreshToken: string | undefined): Promise<AuthResult> {
    const expired = new UnauthorizedException(
      'Your session has expired. Please sign in again.',
    );
    if (!rawRefreshToken) throw expired;

    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(rawRefreshToken) },
      include: { user: true },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw expired;
    }

    // Rotate: revoke the presented token and issue a fresh pair.
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    return this.issueSession(record.user);
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(rawRefreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ── Email verification & password reset ───────────────────────────

  async verifyEmail(rawToken: string): Promise<void> {
    const record = await this.consumeToken(rawToken, TokenType.EMAIL_VERIFICATION);
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always resolve the same way — never reveal whether the email exists.
    if (!user) return;

    const raw = await this.createToken(
      user.id,
      TokenType.PASSWORD_RESET,
      this.config.get('auth.resetTtlSeconds', { infer: true }),
    );
    const url = `${this.webAppUrl()}/reset-password?token=${raw}`;
    await this.email.sendPasswordResetEmail(user.email, url);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const record = await this.consumeToken(rawToken, TokenType.PASSWORD_RESET);
    const passwordHash = await this.passwords.hash(newPassword);
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });
    // Force re-authentication everywhere after a reset.
    await this.prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ── Internals ─────────────────────────────────────────────────────

  private async issueSession(user: User): Promise<AuthResult> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.createRefreshToken(user.id);
    return { user: toPublicUser(user), accessToken, refreshToken };
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const raw = randomToken();
    const expiresAt = new Date(
      Date.now() + this.config.get('auth.refreshTtlSeconds', { infer: true }) * 1000,
    );
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: sha256(raw), expiresAt },
    });
    return raw;
  }

  private async createToken(
    userId: string,
    type: TokenType,
    ttlSeconds: number,
  ): Promise<string> {
    const raw = randomToken();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await this.prisma.token.create({
      data: { userId, type, tokenHash: sha256(raw), expiresAt },
    });
    return raw;
  }

  private async consumeToken(rawToken: string, type: TokenType): Promise<Token> {
    const record = await this.prisma.token.findUnique({
      where: { tokenHash: sha256(rawToken) },
    });
    if (!record || record.type !== type || record.consumedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('This link is invalid or has expired.');
    }
    await this.prisma.token.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
    return record;
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const raw = await this.createToken(
      user.id,
      TokenType.EMAIL_VERIFICATION,
      this.config.get('auth.verificationTtlSeconds', { infer: true }),
    );
    const url = `${this.webAppUrl()}/verify-email?token=${raw}`;
    await this.email.sendVerificationEmail(user.email, url);
  }

  private webAppUrl(): string {
    return this.config.get('app.webAppUrl', { infer: true }).replace(/\/$/, '');
  }
}

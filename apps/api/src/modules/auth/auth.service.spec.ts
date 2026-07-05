import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { TokenType, type User } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { PasswordService } from '../security/password.service';
import { EmailService } from '../email/email.service';

const TTL: Record<string, number | string> = {
  'auth.refreshTtlSeconds': 604800,
  'auth.verificationTtlSeconds': 86400,
  'auth.resetTtlSeconds': 3600,
  'app.webAppUrl': 'http://localhost:5173',
};

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'a@matal.dev',
    username: 'alice',
    displayName: 'Alice',
    passwordHash: 'hashed',
    role: 'USER',
    avatarUrl: null,
    bio: null,
    organizationId: null,
    emailVerified: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function setup() {
  const prisma = {
    user: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    token: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  };
  const passwords = { hash: jest.fn().mockResolvedValue('hashed'), verify: jest.fn() };
  const jwt = { signAsync: jest.fn().mockResolvedValue('access-token') };
  const email = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };
  const config = { get: (key: string) => TTL[key] };

  const service = new AuthService(
    prisma as unknown as PrismaService,
    passwords as unknown as PasswordService,
    jwt as never,
    email as unknown as EmailService,
    config as never,
  );
  return { service, prisma, passwords, jwt, email };
}

describe('AuthService', () => {
  describe('register', () => {
    it('creates a user, issues a session, and sends a verification email', async () => {
      const { service, prisma, email } = setup();
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(buildUser());
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.token.create.mockResolvedValue({});

      const result = await service.register({
        email: 'a@matal.dev',
        username: 'alice',
        displayName: 'Alice',
        password: 'Password1',
      });

      expect(result.user.email).toBe('a@matal.dev');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
      expect(email.sendVerificationEmail).toHaveBeenCalledTimes(1);
    });

    it('rejects a duplicate email with a conflict', async () => {
      const { service, prisma } = setup();
      prisma.user.findFirst.mockResolvedValue({ email: 'a@matal.dev', username: 'other' });

      await expect(
        service.register({
          email: 'a@matal.dev',
          username: 'alice',
          displayName: 'Alice',
          password: 'Password1',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('rejects an unknown email with a generic error', async () => {
      const { service, prisma } = setup();
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x@matal.dev', password: 'Password1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      const { service, prisma, passwords } = setup();
      prisma.user.findUnique.mockResolvedValue(buildUser());
      passwords.verify.mockResolvedValue(false);
      await expect(
        service.login({ email: 'a@matal.dev', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('issues a session on valid credentials', async () => {
      const { service, prisma, passwords } = setup();
      prisma.user.findUnique.mockResolvedValue(buildUser());
      passwords.verify.mockResolvedValue(true);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({ email: 'a@matal.dev', password: 'Password1' });
      expect(result.user.username).toBe('alice');
      expect(result.accessToken).toBe('access-token');
    });
  });

  describe('refresh', () => {
    it('rejects a missing or unknown refresh token', async () => {
      const { service, prisma } = setup();
      await expect(service.refresh(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh('nope')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rotates a valid refresh token and issues a new session', async () => {
      const { service, prisma } = setup();
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100_000),
        user: buildUser(),
      });
      prisma.refreshToken.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh('valid-token');

      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rt-1' } }),
      );
      expect(result.accessToken).toBe('access-token');
    });

    it('rejects an expired refresh token', async () => {
      const { service, prisma } = setup();
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: buildUser(),
      });
      await expect(service.refresh('expired')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revokes the presented refresh token', async () => {
      const { service, prisma } = setup();
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      await service.logout('some-token');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledTimes(1);
    });

    it('is a no-op without a token', async () => {
      const { service, prisma } = setup();
      await service.logout(undefined);
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('consumes the token and marks the email verified', async () => {
      const { service, prisma } = setup();
      prisma.token.findUnique.mockResolvedValue({
        id: 't-1',
        userId: 'user-1',
        type: TokenType.EMAIL_VERIFICATION,
        consumedAt: null,
        expiresAt: new Date(Date.now() + 100_000),
      });
      prisma.token.update.mockResolvedValue({});
      prisma.user.update.mockResolvedValue(buildUser({ emailVerified: true }));

      await service.verifyEmail('tok');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { emailVerified: true } }),
      );
    });
  });
});

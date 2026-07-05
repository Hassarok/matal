import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ACCESS_COOKIE } from '../auth.types';

function contextWith(cookies: Record<string, string>) {
  const request: { cookies: Record<string, string>; user?: unknown } = { cookies };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { ctx, request };
}

describe('JwtAuthGuard', () => {
  it('throws when no access cookie is present', async () => {
    const guard = new JwtAuthGuard({ verifyAsync: jest.fn() } as unknown as JwtService);
    const { ctx } = contextWith({});
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws when the token is invalid', async () => {
    const jwt = { verifyAsync: jest.fn().mockRejectedValue(new Error('bad')) };
    const guard = new JwtAuthGuard(jwt as unknown as JwtService);
    const { ctx } = contextWith({ [ACCESS_COOKIE]: 'tampered' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the principal for a valid token', async () => {
    const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'u1', role: 'USER' }) };
    const guard = new JwtAuthGuard(jwt as unknown as JwtService);
    const { ctx, request } = contextWith({ [ACCESS_COOKIE]: 'valid' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'u1', role: 'USER' });
  });
});

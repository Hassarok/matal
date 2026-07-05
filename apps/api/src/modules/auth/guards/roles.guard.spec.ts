import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';

function contextWith(role: UserRole) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u1', role } }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function guardWithRequired(required: UserRole[] | undefined) {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(required) };
  return new RolesGuard(reflector as unknown as Reflector);
}

describe('RolesGuard', () => {
  it('allows routes without @Roles metadata', () => {
    const guard = guardWithRequired(undefined);
    expect(guard.canActivate(contextWith('USER'))).toBe(true);
  });

  it('allows a user whose role is permitted', () => {
    const guard = guardWithRequired(['ADMIN']);
    expect(guard.canActivate(contextWith('ADMIN'))).toBe(true);
  });

  it('forbids a user whose role is not permitted', () => {
    const guard = guardWithRequired(['ADMIN']);
    expect(() => guard.canActivate(contextWith('USER'))).toThrow(ForbiddenException);
  });
});

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@matal/shared-types';
import type { AdminListQuery } from '@matal/validation';
import { AdminService } from './admin.service';
import { PrismaService } from '../../database/prisma.service';

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'ada@matal.dev',
    username: 'ada',
    displayName: 'Ada',
    role: 'USER',
    emailVerified: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    _count: { quizzes: 3, hostedGames: 2 },
    ...overrides,
  };
}

function setup() {
  const prisma = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    quiz: { count: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new AdminService(prisma as unknown as PrismaService);
  return { service, prisma };
}

const query: AdminListQuery = { page: 1, pageSize: 20 };

describe('AdminService', () => {
  describe('listUsers', () => {
    it('maps rows to admin users with role and counts', async () => {
      const { service, prisma } = setup();
      prisma.$transaction.mockResolvedValue([1, [userRow({ role: 'ADMIN' })]]);

      const result = await service.listUsers(query);

      expect(result.meta.total).toBe(1);
      expect(result.items[0]).toMatchObject({
        id: 'user-1',
        role: UserRole.Admin,
        quizCount: 3,
        gameCount: 2,
      });
    });
  });

  describe('updateUserRole', () => {
    it('refuses to change your own role', async () => {
      const { service, prisma } = setup();
      await expect(
        service.updateUserRole('me', 'me', UserRole.Admin),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('updates another user and returns the mapped row', async () => {
      const { service, prisma } = setup();
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.user.update.mockResolvedValue(userRow({ role: 'ADMIN' }));

      const result = await service.updateUserRole('admin', 'user-1', UserRole.Admin);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' }, data: { role: 'ADMIN' } }),
      );
      expect(result.role).toBe(UserRole.Admin);
    });
  });

  describe('deleteUser', () => {
    it('refuses to delete your own account', async () => {
      const { service, prisma } = setup();
      await expect(service.deleteUser('me', 'me')).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('throws NotFound for an unknown user', async () => {
      const { service, prisma } = setup();
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.deleteUser('admin', 'ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('deleteQuiz', () => {
    it('throws NotFound when nothing was deleted', async () => {
      const { service, prisma } = setup();
      prisma.quiz.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.deleteQuiz('ghost')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

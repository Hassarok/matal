import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type UserRole as PrismaUserRole } from '@prisma/client';
import {
  UserRole,
  type AdminQuizItem,
  type AdminStats,
  type AdminUser,
  type Paginated,
  type QuizVisibility,
} from '@matal/shared-types';
import type { AdminListQuery } from '@matal/validation';
import { PrismaService } from '../../database/prisma.service';

const USER_COUNT_SELECT = {
  quizzes: true,
  hostedGames: true,
} satisfies Prisma.UserCountOutputTypeSelect;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Platform-wide totals for the admin overview. */
  async stats(): Promise<AdminStats> {
    const [totalUsers, totalQuizzes, totalGames, totalQuestions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.quiz.count(),
      this.prisma.game.count(),
      this.prisma.question.count(),
    ]);
    return { totalUsers, totalQuizzes, totalGames, totalQuestions };
  }

  async listUsers(query: AdminListQuery): Promise<Paginated<AdminUser>> {
    const where: Prisma.UserWhereInput = query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' } },
            { username: { contains: query.search, mode: 'insensitive' } },
            { displayName: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { _count: { select: USER_COUNT_SELECT } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      items: rows.map((user) => this.toAdminUser(user)),
      meta: this.meta(query, total),
    };
  }

  async updateUserRole(
    actorId: string,
    targetId: string,
    role: UserRole,
  ): Promise<AdminUser> {
    if (actorId === targetId) {
      throw new ForbiddenException('You cannot change your own role.');
    }
    await this.requireUser(targetId);
    const user = await this.prisma.user.update({
      where: { id: targetId },
      data: { role: role as unknown as PrismaUserRole },
      include: { _count: { select: USER_COUNT_SELECT } },
    });
    return this.toAdminUser(user);
  }

  async deleteUser(actorId: string, targetId: string): Promise<void> {
    if (actorId === targetId) {
      throw new ForbiddenException('You cannot delete your own account here.');
    }
    await this.requireUser(targetId);
    // Cascades remove the user's quizzes, hosted games, tokens and sessions.
    await this.prisma.user.delete({ where: { id: targetId } });
  }

  async listQuizzes(query: AdminListQuery): Promise<Paginated<AdminQuizItem>> {
    const where: Prisma.QuizWhereInput = query.search
      ? { title: { contains: query.search, mode: 'insensitive' } }
      : {};

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.quiz.count({ where }),
      this.prisma.quiz.findMany({
        where,
        include: {
          owner: { select: { displayName: true } },
          _count: { select: { questions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      items: rows.map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        visibility: quiz.visibility as QuizVisibility,
        questionCount: quiz._count.questions,
        ownerId: quiz.ownerId,
        ownerName: quiz.owner.displayName,
        createdAt: quiz.createdAt.toISOString(),
      })),
      meta: this.meta(query, total),
    };
  }

  async deleteQuiz(id: string): Promise<void> {
    const result = await this.prisma.quiz.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundException('Quiz not found.');
  }

  // ── Internals ─────────────────────────────────────────────────────

  private toAdminUser(
    user: Prisma.UserGetPayload<{ include: { _count: { select: typeof USER_COUNT_SELECT } } }>,
  ): AdminUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role === 'ADMIN' ? UserRole.Admin : UserRole.User,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      quizCount: user._count.quizzes,
      gameCount: user._count.hostedGames,
    };
  }

  private async requireUser(id: string): Promise<void> {
    const exists = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('User not found.');
  }

  private meta(query: AdminListQuery, total: number) {
    return {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }
}

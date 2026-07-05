import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  type Difficulty as PrismaDifficulty,
  type QuestionType as PrismaQuestionType,
  type QuizVisibility as PrismaVisibility,
} from '@prisma/client';
import type { Paginated, QuizDetail, QuizListItem } from '@matal/shared-types';
import type { QuestionInput, QuizListQuery, SaveQuizInput } from '@matal/validation';
import { PrismaService } from '../../database/prisma.service';
import { toQuizDetail, toQuizListItem } from './quiz.mapper';

const LIST_INCLUDE = {
  category: true,
  _count: { select: { questions: true } },
} satisfies Prisma.QuizInclude;

const DETAIL_INCLUDE = {
  category: true,
  questions: true,
} satisfies Prisma.QuizInclude;

/** Splits a validated question into DB columns + type-specific `content` JSON. */
function questionCreateData(
  question: QuestionInput,
  order: number,
): Prisma.QuestionCreateWithoutQuizInput {
  const { type, prompt, mediaUrl, explanation, timeLimitSeconds, points, ...content } =
    question;
  return {
    type: type as unknown as PrismaQuestionType,
    prompt,
    mediaUrl: mediaUrl || null,
    explanation: explanation || null,
    timeLimitSeconds,
    points,
    order,
    content: content as unknown as Prisma.InputJsonValue,
  };
}

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, input: SaveQuizInput): Promise<QuizDetail> {
    const quiz = await this.prisma.quiz.create({
      data: {
        ...this.metadata(input),
        ownerId,
        questions: { create: input.questions.map(questionCreateData) },
      },
      include: DETAIL_INCLUDE,
    });
    return toQuizDetail(quiz);
  }

  async list(ownerId: string, query: QuizListQuery): Promise<Paginated<QuizListItem>> {
    const where: Prisma.QuizWhereInput = {
      ownerId,
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' } }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.difficulty
        ? { difficulty: query.difficulty as unknown as PrismaDifficulty }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.quiz.count({ where }),
      this.prisma.quiz.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy: { updatedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      items: rows.map(toQuizListItem),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async findOne(ownerId: string, id: string): Promise<QuizDetail> {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id, ownerId },
      include: DETAIL_INCLUDE,
    });
    if (!quiz) throw new NotFoundException('Quiz not found.');
    return toQuizDetail(quiz);
  }

  async update(ownerId: string, id: string, input: SaveQuizInput): Promise<QuizDetail> {
    await this.assertOwner(ownerId, id);
    const quiz = await this.prisma.quiz.update({
      where: { id },
      data: {
        ...this.metadata(input),
        // Replace all questions wholesale (simple, predictable for a builder).
        questions: {
          deleteMany: {},
          create: input.questions.map(questionCreateData),
        },
      },
      include: DETAIL_INCLUDE,
    });
    return toQuizDetail(quiz);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.prisma.quiz.deleteMany({ where: { id, ownerId } });
    if (result.count === 0) throw new NotFoundException('Quiz not found.');
  }

  async duplicate(ownerId: string, id: string): Promise<QuizDetail> {
    const source = await this.prisma.quiz.findFirst({
      where: { id, ownerId },
      include: DETAIL_INCLUDE,
    });
    if (!source) throw new NotFoundException('Quiz not found.');

    const orderedQuestions = [...source.questions].sort((a, b) => a.order - b.order);
    const quiz = await this.prisma.quiz.create({
      data: {
        title: `${source.title} (Copy)`,
        description: source.description,
        coverImageUrl: source.coverImageUrl,
        difficulty: source.difficulty,
        visibility: source.visibility,
        tags: source.tags,
        ownerId,
        categoryId: source.categoryId,
        questions: {
          create: orderedQuestions.map((q, order) => ({
            type: q.type,
            prompt: q.prompt,
            mediaUrl: q.mediaUrl,
            explanation: q.explanation,
            timeLimitSeconds: q.timeLimitSeconds,
            points: q.points,
            order,
            content: q.content as unknown as Prisma.InputJsonValue,
          })),
        },
      },
      include: DETAIL_INCLUDE,
    });
    return toQuizDetail(quiz);
  }

  // ── Internals ─────────────────────────────────────────────────────

  private metadata(input: SaveQuizInput) {
    return {
      title: input.title,
      description: input.description || null,
      coverImageUrl: input.coverImageUrl || null,
      difficulty: input.difficulty as unknown as PrismaDifficulty,
      visibility: input.visibility as unknown as PrismaVisibility,
      tags: input.tags,
      categoryId: input.categoryId ?? null,
    };
  }

  private async assertOwner(ownerId: string, id: string): Promise<void> {
    const exists = await this.prisma.quiz.findFirst({
      where: { id, ownerId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Quiz not found.');
  }
}

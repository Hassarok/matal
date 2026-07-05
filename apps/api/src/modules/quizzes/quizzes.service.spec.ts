import { NotFoundException } from '@nestjs/common';
import type { SaveQuizInput } from '@matal/validation';
import { QuizzesService } from './quizzes.service';
import { PrismaService } from '../../database/prisma.service';

function quizRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'quiz-1',
    title: 'Kurdish Geography',
    description: null,
    coverImageUrl: null,
    difficulty: 'MEDIUM',
    visibility: 'PRIVATE',
    tags: [],
    ownerId: 'owner-1',
    categoryId: null,
    category: null,
    questions: [],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function setup() {
  const prisma = {
    quiz: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const service = new QuizzesService(prisma as unknown as PrismaService);
  return { service, prisma };
}

const baseInput: SaveQuizInput = {
  title: 'Kurdish Geography',
  description: '',
  coverImageUrl: '',
  categoryId: null,
  difficulty: 'MEDIUM' as SaveQuizInput['difficulty'],
  visibility: 'PRIVATE' as SaveQuizInput['visibility'],
  tags: [],
  questions: [],
};

describe('QuizzesService', () => {
  describe('create', () => {
    it('creates the quiz under the owner and returns its detail', async () => {
      const { service, prisma } = setup();
      prisma.quiz.create.mockResolvedValue(quizRow());

      const result = await service.create('owner-1', baseInput);

      expect(prisma.quiz.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ ownerId: 'owner-1' }) }),
      );
      expect(result.id).toBe('quiz-1');
      expect(result.difficulty).toBe('MEDIUM');
    });
  });

  describe('findOne', () => {
    it('throws NotFound when the quiz is not owned by the user', async () => {
      const { service, prisma } = setup();
      prisma.quiz.findFirst.mockResolvedValue(null);
      await expect(service.findOne('owner-1', 'quiz-x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('throws NotFound (ownership) before updating', async () => {
      const { service, prisma } = setup();
      prisma.quiz.findFirst.mockResolvedValue(null); // assertOwner fails
      await expect(service.update('owner-1', 'quiz-x', baseInput)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.quiz.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFound when nothing was deleted', async () => {
      const { service, prisma } = setup();
      prisma.quiz.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.remove('owner-1', 'quiz-x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('resolves when the owner deletes their quiz', async () => {
      const { service, prisma } = setup();
      prisma.quiz.deleteMany.mockResolvedValue({ count: 1 });
      await expect(service.remove('owner-1', 'quiz-1')).resolves.toBeUndefined();
    });
  });
});

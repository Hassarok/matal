import { NotFoundException } from '@nestjs/common';
import { GamesService } from './games.service';
import { PrismaService } from '../../database/prisma.service';
import type { GameStateStore } from './game-state.store';

function setup() {
  const prisma = {
    game: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  };
  const store = {} as GameStateStore;
  const service = new GamesService(prisma as unknown as PrismaService, store);
  return { service, prisma };
}

describe('GamesService — reports & analytics', () => {
  describe('report', () => {
    it('throws NotFound when the game is not owned by the host', async () => {
      const { service, prisma } = setup();
      prisma.game.findFirst.mockResolvedValue(null);
      await expect(service.report('host-1', 'game-x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('aggregates per-question stats and player standings', async () => {
      const { service, prisma } = setup();
      prisma.game.findFirst.mockResolvedValue({
        id: 'game-1',
        quizTitle: 'Rivers',
        pin: '123456',
        questionCount: 2,
        playerCount: 2,
        startedAt: new Date('2026-01-01T00:00:00Z'),
        endedAt: new Date('2026-01-01T00:05:00Z'),
        players: [
          { nickname: 'Ada', rank: 1, score: 1500, correctCount: 2 },
          { nickname: 'Bо', rank: 2, score: 500, correctCount: 1 },
        ],
        responses: [
          { questionIndex: 0, correct: true, points: 900, responseMs: 2000 },
          { questionIndex: 0, correct: true, points: 600, responseMs: 4000 },
          { questionIndex: 1, correct: true, points: 800, responseMs: 1000 },
          { questionIndex: 1, correct: false, points: 0, responseMs: 3000 },
        ],
      });

      const report = await service.report('host-1', 'game-1');

      expect(report.durationMs).toBe(5 * 60 * 1000);
      expect(report.averageScore).toBe(1000);
      expect(report.winnerNickname).toBe('Ada');
      expect(report.questions).toHaveLength(2);
      // Q1: 2/2 correct, avg (2000+4000)/2 = 3000ms
      expect(report.questions[0]).toMatchObject({
        questionIndex: 0,
        answerCount: 2,
        correctCount: 2,
        correctRate: 1,
        averageResponseMs: 3000,
      });
      // Q2: 1/2 correct → rate 0.5, avg (1000+3000)/2 = 2000ms
      expect(report.questions[1]).toMatchObject({
        answerCount: 2,
        correctCount: 1,
        correctRate: 0.5,
        averageResponseMs: 2000,
      });
    });

    it('reports zeroed stats for a question nobody answered', async () => {
      const { service, prisma } = setup();
      prisma.game.findFirst.mockResolvedValue({
        id: 'game-1',
        quizTitle: 'Empty',
        pin: '000000',
        questionCount: 1,
        playerCount: 0,
        startedAt: new Date('2026-01-01T00:00:00Z'),
        endedAt: new Date('2026-01-01T00:00:10Z'),
        players: [],
        responses: [],
      });

      const report = await service.report('host-1', 'game-1');
      expect(report.averageScore).toBe(0);
      expect(report.winnerNickname).toBeNull();
      expect(report.questions[0]).toMatchObject({
        answerCount: 0,
        correctRate: 0,
        averageResponseMs: 0,
      });
    });
  });

  describe('analytics', () => {
    it('summarises totals and most-played quizzes', async () => {
      const { service, prisma } = setup();
      prisma.game.aggregate.mockResolvedValue({
        _count: { _all: 4 },
        _sum: { playerCount: 40, questionCount: 20 },
      });
      prisma.game.groupBy.mockResolvedValue([
        { quizTitle: 'Rivers', _count: { quizTitle: 3 } },
        { quizTitle: 'Capitals', _count: { quizTitle: 1 } },
      ]);

      const analytics = await service.analytics('host-1');

      expect(analytics).toMatchObject({
        totalGames: 4,
        totalPlayers: 40,
        totalQuestions: 20,
        averagePlayersPerGame: 10,
      });
      expect(analytics.topQuizzes[0]).toEqual({ quizTitle: 'Rivers', timesPlayed: 3 });
    });

    it('handles a host with no games', async () => {
      const { service, prisma } = setup();
      prisma.game.aggregate.mockResolvedValue({
        _count: { _all: 0 },
        _sum: { playerCount: null, questionCount: null },
      });
      prisma.game.groupBy.mockResolvedValue([]);

      const analytics = await service.analytics('host-1');
      expect(analytics.totalGames).toBe(0);
      expect(analytics.averagePlayersPerGame).toBe(0);
      expect(analytics.topQuizzes).toEqual([]);
    });
  });

  describe('history', () => {
    it('maps rows and returns pagination meta', async () => {
      const { service, prisma } = setup();
      prisma.$transaction.mockResolvedValue([
        1,
        [
          {
            id: 'game-1',
            quizTitle: 'Rivers',
            pin: '123456',
            questionCount: 5,
            playerCount: 8,
            startedAt: new Date('2026-01-01T00:00:00Z'),
            endedAt: new Date('2026-01-01T00:05:00Z'),
            players: [{ nickname: 'Ada' }],
          },
        ],
      ]);

      const result = await service.history('host-1', { page: 1, pageSize: 20 });

      expect(result.meta).toMatchObject({ page: 1, total: 1, totalPages: 1 });
      expect(result.items[0]).toMatchObject({ id: 'game-1', winnerNickname: 'Ada' });
    });
  });
});

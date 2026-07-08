import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import {
  GamePhase,
  type AnswerSubmission,
  type GameSummary,
  type LobbyState,
  type Paginated,
  type PlayerResult,
  type QuestionContent,
  type QuestionType,
  type QuestionReveal,
  type GamePodium,
} from '@matal/shared-types';
import type { PaginationQuery } from '@matal/validation';
import { PrismaService } from '../../database/prisma.service';
import { randomToken } from '../../common/hash.util';
import { GameStateStore } from './game-state.store';
import { generatePin } from './pin.util';
import type { GamePlayerState, GameSession, LoadedQuestion } from './game.types';
import {
  buildDistribution,
  buildLeaderboard,
  buildPodium,
  computePoints,
  isCorrect,
} from './scoring';

/** Domain error surfaced to a socket client as a friendly game error. */
export class GameActionError extends Error {}

export interface JoinResult {
  session: GameSession;
  player: GamePlayerState;
}

export interface AnswerResult {
  result: PlayerResult;
  player: GamePlayerState;
  allAnswered: boolean;
}

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly store: GameStateStore,
  ) {}

  // ── Creation & membership ─────────────────────────────────────────

  async createGame(
    hostId: string,
    quizId: string,
    hostSocketId: string,
  ): Promise<GameSession> {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, ownerId: hostId },
      include: { questions: true },
    });
    if (!quiz) throw new GameActionError('Quiz not found.');

    const questions: LoadedQuestion[] = [...quiz.questions]
      .sort((a, b) => a.order - b.order)
      .map((q, index) => ({
        index,
        type: q.type as QuestionType,
        prompt: q.prompt,
        mediaUrl: q.mediaUrl,
        explanation: q.explanation,
        timeLimitSeconds: q.timeLimitSeconds,
        points: q.points,
        content: q.content as unknown as QuestionContent,
      }));
    if (questions.length === 0) throw new GameActionError('This quiz has no questions yet.');

    let pin = generatePin();
    while (this.store.pinExists(pin)) pin = generatePin();

    const session: GameSession = {
      id: randomUUID(),
      pin,
      hostId,
      hostSocketId,
      quizId,
      quizTitle: quiz.title,
      questions,
      phase: GamePhase.Lobby,
      players: new Map(),
      currentIndex: -1,
      active: null,
      startedAt: null,
      createdAt: Date.now(),
    };
    this.store.create(session);
    return session;
  }

  joinGame(pin: string, nickname: string, socketId: string): JoinResult {
    const session = this.store.getByPin(pin);
    if (!session) throw new GameActionError('No game found with that PIN.');
    if (session.phase !== GamePhase.Lobby) {
      throw new GameActionError('This game has already started.');
    }

    const requested = nickname.trim().slice(0, 20) || 'Player';
    const taken = new Set(
      [...session.players.values()].map((p) => p.nickname.toLowerCase()),
    );
    let finalNick = requested;
    let suffix = 2;
    while (taken.has(finalNick.toLowerCase())) finalNick = `${requested} ${suffix++}`;

    const player: GamePlayerState = {
      id: randomUUID(),
      token: randomToken(),
      nickname: finalNick,
      socketId,
      connected: true,
      disconnectedAt: null,
      score: 0,
      streak: 0,
      answers: [],
    };
    session.players.set(player.id, player);
    return { session, player };
  }

  rejoinPlayer(pin: string, token: string, socketId: string): JoinResult {
    const session = this.store.getByPin(pin);
    if (!session) throw new GameActionError('This game is no longer available.');
    const player = [...session.players.values()].find((p) => p.token === token);
    if (!player) throw new GameActionError('We could not restore your session.');
    player.socketId = socketId;
    player.connected = true;
    player.disconnectedAt = null;
    return { session, player };
  }

  attachHost(gameId: string, hostId: string, socketId: string): GameSession {
    const session = this.requireHost(gameId, hostId);
    session.hostSocketId = socketId;
    return session;
  }

  // ── Flow control ──────────────────────────────────────────────────

  startGame(gameId: string, hostId: string): GameSession {
    const session = this.requireHost(gameId, hostId);
    if (session.phase !== GamePhase.Lobby) {
      throw new GameActionError('The game has already started.');
    }
    if (session.players.size === 0) {
      throw new GameActionError('Wait for at least one player to join.');
    }
    return this.beginQuestion(session, 0);
  }

  beginQuestion(session: GameSession, index: number): GameSession {
    const question = session.questions[index];
    const startedAt = Date.now();
    session.currentIndex = index;
    session.phase = GamePhase.Question;
    session.active = {
      index,
      startedAt,
      endsAt: startedAt + question.timeLimitSeconds * 1000,
      answers: new Map(),
    };
    if (session.startedAt === null) session.startedAt = startedAt;
    return session;
  }

  submitAnswer(
    gameId: string,
    playerId: string,
    submission: AnswerSubmission,
    now = Date.now(),
  ): AnswerResult | null {
    const session = this.store.get(gameId);
    if (!session || session.phase !== GamePhase.Question || !session.active) {
      throw new GameActionError('There is no active question.');
    }
    if (submission.questionIndex !== session.active.index) return null; // stale
    const player = session.players.get(playerId);
    if (!player) throw new GameActionError('You are not part of this game.');
    if (session.active.answers.has(playerId)) return null; // already answered

    const question = session.questions[session.active.index];
    const responseMs = Math.max(0, now - session.active.startedAt);
    const correct = isCorrect(question, submission);
    const pointsEarned = computePoints(
      correct,
      question.points,
      responseMs,
      question.timeLimitSeconds * 1000,
    );

    player.score += pointsEarned;
    player.streak = correct ? player.streak + 1 : 0;
    player.answers.push({ questionIndex: question.index, correct, points: pointsEarned, responseMs });
    session.active.answers.set(playerId, { submission, correct, points: pointsEarned, responseMs });

    const rank =
      buildLeaderboard([...session.players.values()]).find((e) => e.playerId === playerId)
        ?.rank ?? 0;

    const connected = [...session.players.values()].filter((p) => p.connected).length;
    return {
      result: { correct, pointsEarned, totalScore: player.score, rank, streak: player.streak },
      player,
      allAnswered: session.active.answers.size >= connected && connected > 0,
    };
  }

  revealQuestion(session: GameSession): QuestionReveal | null {
    if (session.phase !== GamePhase.Question || !session.active) return null;
    session.phase = GamePhase.Reveal;
    const question = session.questions[session.active.index];
    const answers = [...session.active.answers.values()].map((a) => ({
      correct: a.correct,
      submission: a.submission,
    }));
    return {
      index: session.active.index,
      distribution: buildDistribution(question, answers),
      leaderboard: buildLeaderboard([...session.players.values()]),
    };
  }

  /** Advance from a reveal to the next question. Returns null when the game is over. */
  advance(gameId: string, hostId: string): GameSession | null {
    const session = this.requireHost(gameId, hostId);
    const next = session.currentIndex + 1;
    if (next >= session.questions.length) return null;
    return this.beginQuestion(session, next);
  }

  async endGame(gameId: string, hostId: string): Promise<GamePodium> {
    const session = this.requireHost(gameId, hostId);
    session.phase = GamePhase.Ended;
    const podium = buildPodium([...session.players.values()], session.questions.length);
    await this.persist(session);
    this.store.delete(gameId);
    return podium;
  }

  // ── Disconnect / reconnection ─────────────────────────────────────

  handleDisconnect(
    socketId: string,
  ): { session: GameSession; player?: GamePlayerState; isHost: boolean } | null {
    for (const session of this.store.all()) {
      if (session.hostSocketId === socketId) {
        session.hostSocketId = null;
        return { session, isHost: true };
      }
      const player = [...session.players.values()].find((p) => p.socketId === socketId);
      if (player) {
        player.connected = false;
        player.disconnectedAt = Date.now();
        player.socketId = null;
        return { session, player, isHost: false };
      }
    }
    return null;
  }

  /** After the grace period, drop a still-disconnected player who never got past the lobby. */
  dropIfAbandonedInLobby(gameId: string, playerId: string): GameSession | null {
    const session = this.store.get(gameId);
    if (!session) return null;
    const player = session.players.get(playerId);
    if (!player || player.connected) return null;
    if (session.phase === GamePhase.Lobby) {
      session.players.delete(playerId);
      return session;
    }
    return null;
  }

  // ── History (persisted, completed games) ──────────────────────────

  /** Paginated list of completed games hosted by a user, newest first. */
  async history(hostId: string, query: PaginationQuery): Promise<Paginated<GameSummary>> {
    const where = { hostId };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.game.count({ where }),
      this.prisma.game.findMany({
        where,
        orderBy: { endedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          players: { orderBy: { rank: 'asc' }, take: 1, select: { nickname: true } },
        },
      }),
    ]);

    return {
      items: rows.map((game) => ({
        id: game.id,
        quizTitle: game.quizTitle,
        pin: game.pin,
        questionCount: game.questionCount,
        playerCount: game.playerCount,
        winnerNickname: game.players[0]?.nickname ?? null,
        startedAt: game.startedAt.toISOString(),
        endedAt: game.endedAt.toISOString(),
      })),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────

  getSession(gameId: string): GameSession | undefined {
    return this.store.get(gameId);
  }

  toLobbyState(session: GameSession): LobbyState {
    return {
      pin: session.pin,
      quizTitle: session.quizTitle,
      questionCount: session.questions.length,
      players: [...session.players.values()].map((p) => ({
        id: p.id,
        nickname: p.nickname,
        connected: p.connected,
      })),
    };
  }

  private requireHost(gameId: string, hostId: string): GameSession {
    const session = this.store.get(gameId);
    if (!session) throw new GameActionError('Game not found.');
    if (session.hostId !== hostId) throw new GameActionError('Only the host can do that.');
    return session;
  }

  private async persist(session: GameSession): Promise<void> {
    try {
      const players = [...session.players.values()];
      const rankById = new Map(
        buildLeaderboard(players).map((e) => [e.playerId, e.rank]),
      );
      await this.prisma.game.create({
        data: {
          pin: session.pin,
          quizId: session.quizId ?? undefined,
          hostId: session.hostId,
          quizTitle: session.quizTitle,
          questionCount: session.questions.length,
          playerCount: players.length,
          startedAt: new Date(session.startedAt ?? session.createdAt),
          players: {
            create: players.map((p) => ({
              nickname: p.nickname,
              score: p.score,
              rank: rankById.get(p.id) ?? 0,
              correctCount: p.answers.filter((a) => a.correct).length,
            })),
          },
          responses: {
            create: players.flatMap((p) =>
              p.answers.map((a) => ({
                questionIndex: a.questionIndex,
                nickname: p.nickname,
                correct: a.correct,
                points: a.points,
                responseMs: a.responseMs,
              })),
            ),
          },
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to persist game ${session.id}: ${String(error)}`);
    }
  }
}

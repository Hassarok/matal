import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import {
  GameEvents,
  GamePhase,
  type AnswerSubmission,
  type HostCreatePayload,
  type PlayerResult,
} from '@matal/shared-types';
import { liveQuizSchema } from '@matal/validation';
import {
  ACCESS_COOKIE,
  GUEST_COOKIE,
  type GuestJwtPayload,
  type JwtPayload,
} from '../auth/auth.types';
import { GameActionError, GamesService } from './games.service';
import type { GameSession } from './game.types';
import { toHostQuestion, toPlayerQuestion } from './scoring';

const GRACE_MS = 30_000;

function socketCorsOrigins(): string[] {
  return (
    process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? [
      'http://localhost:5173',
    ]
  );
}

function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name) out[name] = decodeURIComponent(rest.join('='));
  }
  return out;
}

interface PlayerSocketData {
  gameId?: string;
  playerId?: string;
}

/**
 * Live-game gateway. Drives the full lobby → question → reveal → podium flow
 * over Socket.IO with server-authoritative timing/scoring, and reconnection
 * with a grace period. Game state lives in {@link GamesService}; this gateway
 * owns the sockets, rooms, timers, and broadcasting.
 */
@WebSocketGateway({
  namespace: '/game',
  cors: { origin: socketCorsOrigins(), credentials: true },
})
export class GameGateway implements OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);
  private readonly questionTimers = new Map<string, NodeJS.Timeout>();
  private readonly graceTimers = new Map<string, NodeJS.Timeout>();

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly games: GamesService,
    private readonly jwt: JwtService,
  ) {}

  // ── Host actions ──────────────────────────────────────────────────

  @SubscribeMessage(GameEvents.HostCreate)
  handleHostCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: HostCreatePayload,
  ) {
    return this.safe(client, async () => {
      const host = await this.authHost(client);
      const parsed = liveQuizSchema.safeParse(data?.quiz);
      if (!parsed.success) {
        throw new GameActionError('This quiz can’t be hosted. Please check its questions.');
      }
      const session = await this.games.createGame(host, parsed.data, client.id);
      client.join(this.room(session.id));
      client.emit(GameEvents.GameCreated, {
        gameId: session.id,
        pin: session.pin,
        lobby: this.games.toLobbyState(session),
      });
    });
  }

  @SubscribeMessage(GameEvents.HostRejoin)
  handleHostRejoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ) {
    return this.safe(client, async () => {
      const { id: hostId } = await this.authHost(client);
      const session = this.games.attachHost(data.gameId, hostId, client.id);
      client.join(this.room(session.id));
      client.emit(GameEvents.LobbyUpdate, this.games.toLobbyState(session));
      this.resyncHost(client, session);
    });
  }

  @SubscribeMessage(GameEvents.HostStart)
  handleHostStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ) {
    return this.safe(client, async () => {
      const { id: hostId } = await this.authHost(client);
      const session = this.games.startGame(data.gameId, hostId);
      this.runQuestion(session);
    });
  }

  @SubscribeMessage(GameEvents.HostSkip)
  handleHostSkip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ) {
    return this.safe(client, async () => {
      const { id: hostId } = await this.authHost(client);
      const session = this.games.getSession(data.gameId);
      if (!session || session.hostId !== hostId) throw new GameActionError('Game not found.');
      this.reveal(session);
    });
  }

  @SubscribeMessage(GameEvents.HostNext)
  handleHostNext(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ) {
    return this.safe(client, async () => {
      const { id: hostId } = await this.authHost(client);
      const next = this.games.advance(data.gameId, hostId);
      if (!next) {
        await this.endGame(data.gameId, hostId);
      } else {
        this.runQuestion(next);
      }
    });
  }

  @SubscribeMessage(GameEvents.HostEnd)
  handleHostEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ) {
    return this.safe(client, async () => {
      const { id: hostId } = await this.authHost(client);
      await this.endGame(data.gameId, hostId);
    });
  }

  // ── Player actions ────────────────────────────────────────────────

  @SubscribeMessage(GameEvents.PlayerJoin)
  handlePlayerJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pin: string; nickname: string },
  ) {
    return this.safe(client, async () => {
      const { session, player } = this.games.joinGame(data.pin, data.nickname, client.id);
      client.join(this.room(session.id));
      (client.data as PlayerSocketData) = { gameId: session.id, playerId: player.id };
      client.emit(GameEvents.PlayerJoined, {
        gameId: session.id,
        playerId: player.id,
        playerToken: player.token,
        nickname: player.nickname,
      });
      this.broadcastLobby(session);
    });
  }

  @SubscribeMessage(GameEvents.PlayerRejoin)
  handlePlayerRejoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pin: string; playerToken: string },
  ) {
    return this.safe(client, async () => {
      const { session, player } = this.games.rejoinPlayer(
        data.pin,
        data.playerToken,
        client.id,
      );
      client.join(this.room(session.id));
      (client.data as PlayerSocketData) = { gameId: session.id, playerId: player.id };
      const grace = this.graceTimers.get(player.id);
      if (grace) {
        clearTimeout(grace);
        this.graceTimers.delete(player.id);
      }
      client.emit(GameEvents.PlayerJoined, {
        gameId: session.id,
        playerId: player.id,
        playerToken: player.token,
        nickname: player.nickname,
      });
      this.broadcastLobby(session);
      this.resyncPlayer(client, session);
    });
  }

  @SubscribeMessage(GameEvents.PlayerAnswer)
  handlePlayerAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() submission: AnswerSubmission,
  ) {
    return this.safe(client, async () => {
      const { gameId, playerId } = (client.data as PlayerSocketData) ?? {};
      if (!gameId || !playerId) return;
      const outcome = this.games.submitAnswer(gameId, playerId, submission);
      if (!outcome) return;

      const session = this.games.getSession(gameId);
      if (session?.hostSocketId && session.active) {
        this.server.to(session.hostSocketId).emit(GameEvents.QuestionStats, {
          answeredCount: session.active.answers.size,
          playerCount: [...session.players.values()].filter((p) => p.connected).length,
        });
      }
      if (outcome.allAnswered && session) {
        this.reveal(session);
      }
    });
  }

  // ── Disconnect / grace period ─────────────────────────────────────

  handleDisconnect(client: Socket): void {
    const found = this.games.handleDisconnect(client.id);
    if (!found) return;
    const { session, player, isHost } = found;
    if (isHost) {
      this.logger.debug(`Host disconnected from game ${session.id}`);
      return;
    }
    if (player) {
      this.broadcastLobby(session);
      // Grace period: drop the player only if they never left the lobby.
      const timer = setTimeout(() => {
        this.graceTimers.delete(player.id);
        const updated = this.games.dropIfAbandonedInLobby(session.id, player.id);
        if (updated) this.broadcastLobby(updated);
      }, GRACE_MS);
      this.graceTimers.set(player.id, timer);
    }
  }

  // ── Flow helpers ──────────────────────────────────────────────────

  private runQuestion(session: GameSession): void {
    const question = session.questions[session.currentIndex];
    const active = session.active;
    if (!active) return;
    const connected = [...session.players.values()].filter((p) => p.connected).length;

    const playerView = toPlayerQuestion(question, session.questions.length, active.endsAt);
    const hostView = toHostQuestion(
      question,
      session.questions.length,
      active.endsAt,
      0,
      connected,
    );

    // Players see the sanitised view; the host sees the answer key + counts.
    const room = this.server.to(this.room(session.id));
    if (session.hostSocketId) {
      room.except(session.hostSocketId).emit(GameEvents.QuestionShow, playerView);
      this.server.to(session.hostSocketId).emit(GameEvents.QuestionShow, hostView);
    } else {
      room.emit(GameEvents.QuestionShow, playerView);
    }

    this.clearQuestionTimer(session.id);
    const timer = setTimeout(
      () => this.reveal(session),
      Math.max(0, active.endsAt - Date.now()),
    );
    this.questionTimers.set(session.id, timer);
  }

  private reveal(session: GameSession): void {
    this.clearQuestionTimer(session.id);
    const revealIndex = session.active?.index;
    const reveal = this.games.revealQuestion(session);
    if (!reveal || revealIndex === undefined) return;

    // Per-player results (their own correctness + points + rank).
    const rankById = new Map(reveal.leaderboard.map((e) => [e.playerId, e.rank]));
    for (const player of session.players.values()) {
      if (!player.socketId) continue;
      const answer = player.answers.find((a) => a.questionIndex === revealIndex);
      const result: PlayerResult = {
        correct: answer?.correct ?? false,
        pointsEarned: answer?.points ?? 0,
        totalScore: player.score,
        rank: rankById.get(player.id) ?? 0,
        streak: player.streak,
      };
      this.server.to(player.socketId).emit(GameEvents.PlayerResult, result);
    }

    this.server.to(this.room(session.id)).emit(GameEvents.QuestionReveal, reveal);
  }

  private async endGame(gameId: string, hostId: string): Promise<void> {
    this.clearQuestionTimer(gameId);
    const podium = await this.games.endGame(gameId, hostId);
    this.server.to(this.room(gameId)).emit(GameEvents.GameEnded, podium);
  }

  private resyncHost(client: Socket, session: GameSession): void {
    if (session.phase === GamePhase.Question && session.active) {
      const question = session.questions[session.active.index];
      const connected = [...session.players.values()].filter((p) => p.connected).length;
      client.emit(
        GameEvents.QuestionShow,
        toHostQuestion(
          question,
          session.questions.length,
          session.active.endsAt,
          session.active.answers.size,
          connected,
        ),
      );
    }
  }

  private resyncPlayer(client: Socket, session: GameSession): void {
    if (session.phase === GamePhase.Question && session.active) {
      const question = session.questions[session.active.index];
      client.emit(
        GameEvents.QuestionShow,
        toPlayerQuestion(question, session.questions.length, session.active.endsAt),
      );
    }
  }

  private broadcastLobby(session: GameSession): void {
    this.server
      .to(this.room(session.id))
      .emit(GameEvents.LobbyUpdate, this.games.toLobbyState(session));
  }

  private clearQuestionTimer(gameId: string): void {
    const timer = this.questionTimers.get(gameId);
    if (timer) {
      clearTimeout(timer);
      this.questionTimers.delete(gameId);
    }
  }

  private room(gameId: string): string {
    return `game:${gameId}`;
  }

  /**
   * Resolves the host's identity from the handshake cookies. A signed-in user
   * (access cookie) hosts as themselves; otherwise a guest cookie provides a
   * stable anonymous identity. Guest games are played but not persisted.
   */
  private async authHost(client: Socket): Promise<{ id: string; isGuest: boolean }> {
    const cookies = parseCookies(client.handshake.headers.cookie);

    const access = cookies[ACCESS_COOKIE];
    if (access) {
      try {
        const payload = await this.jwt.verifyAsync<JwtPayload>(access);
        if (!('guest' in payload)) return { id: payload.sub, isGuest: false };
      } catch {
        // Fall through to the guest cookie.
      }
    }

    const guest = cookies[GUEST_COOKIE];
    if (guest) {
      try {
        const payload = await this.jwt.verifyAsync<GuestJwtPayload>(guest);
        if (payload.guest && payload.sub) return { id: payload.sub, isGuest: true };
      } catch {
        // Fall through to the error below.
      }
    }

    throw new GameActionError(
      'We could not start your game. Please refresh the page and try again.',
    );
  }

  private async safe(client: Socket, work: () => Promise<void>): Promise<void> {
    try {
      await work();
    } catch (error) {
      if (error instanceof GameActionError) {
        client.emit(GameEvents.GameError, { message: error.message });
      } else {
        this.logger.error(`Unexpected game error: ${String(error)}`);
        client.emit(GameEvents.GameError, { message: 'Something went wrong.' });
      }
    }
  }
}

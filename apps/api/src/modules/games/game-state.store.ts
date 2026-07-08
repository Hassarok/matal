import { Injectable } from '@nestjs/common';
import type { GameSession } from './game.types';

/**
 * Storage for live game state. Abstracted so the default single-instance
 * in-memory store can be swapped for a Redis-backed one (multi-instance scale)
 * without touching the engine.
 */
export abstract class GameStateStore {
  abstract create(session: GameSession): void;
  abstract get(gameId: string): GameSession | undefined;
  abstract getByPin(pin: string): GameSession | undefined;
  abstract pinExists(pin: string): boolean;
  abstract delete(gameId: string): void;
  abstract all(): GameSession[];
}

/** In-memory implementation. Sessions are held by reference and mutated in place. */
@Injectable()
export class InMemoryGameStateStore extends GameStateStore {
  private readonly byId = new Map<string, GameSession>();
  private readonly pinToId = new Map<string, string>();

  create(session: GameSession): void {
    this.byId.set(session.id, session);
    this.pinToId.set(session.pin, session.id);
  }

  get(gameId: string): GameSession | undefined {
    return this.byId.get(gameId);
  }

  getByPin(pin: string): GameSession | undefined {
    const id = this.pinToId.get(pin);
    return id ? this.byId.get(id) : undefined;
  }

  pinExists(pin: string): boolean {
    return this.pinToId.has(pin);
  }

  delete(gameId: string): void {
    const session = this.byId.get(gameId);
    if (session) this.pinToId.delete(session.pin);
    this.byId.delete(gameId);
  }

  all(): GameSession[] {
    return [...this.byId.values()];
  }
}

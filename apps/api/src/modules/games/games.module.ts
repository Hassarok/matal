import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GameGateway } from './game.gateway';
import { GameStateStore, InMemoryGameStateStore } from './game-state.store';

/**
 * Live games module. Binds the in-memory game-state store (swap `useClass` for
 * a Redis-backed store to scale across instances). JwtService comes from the
 * global AuthSecurityModule.
 */
@Module({
  providers: [
    GamesService,
    GameGateway,
    { provide: GameStateStore, useClass: InMemoryGameStateStore },
  ],
})
export class GamesModule {}

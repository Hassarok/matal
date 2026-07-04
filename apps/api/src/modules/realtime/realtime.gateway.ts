import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

/**
 * Dev CORS origins for the socket server. Read from the OS env if present,
 * otherwise the local web dev server. Phase 5 replaces this with a proper
 * config-driven Socket.IO adapter and authenticated, room-scoped game events.
 */
function socketCorsOrigins(): string[] {
  return (
    process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? [
      'http://localhost:5173',
    ]
  );
}

/**
 * Real-time gateway (Phase 1 stub).
 *
 * Proves the WebSocket transport is wired end-to-end. It currently supports a
 * simple `connection:ping` → `connection:pong` round-trip the web client uses
 * to display live-connection status. The full live-game engine (lobbies,
 * PINs, timers, scoring, reconnection with grace periods) is built in Phase 5.
 */
@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: socketCorsOrigins(), credentials: true },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  afterInit(): void {
    this.logger.log('Realtime gateway initialised on namespace "/realtime".');
  }

  handleConnection(client: Socket): void {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('connection:ping')
  handlePing(@MessageBody() payload?: { at?: number }): {
    event: 'connection:pong';
    serverTime: number;
    echo?: number;
  } {
    return {
      event: 'connection:pong',
      serverTime: Date.now(),
      echo: payload?.at,
    };
  }
}

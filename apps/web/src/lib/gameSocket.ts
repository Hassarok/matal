import { io, type Socket } from 'socket.io-client';
import { env } from '@/config/env';

/**
 * Creates a fresh connection to the live-game namespace. Each host/player
 * session owns its own socket (so multiple tabs behave independently).
 * Reconnection is enabled — the game hooks re-join/re-sync on reconnect.
 */
export function createGameSocket(): Socket {
  return io(`${env.apiUrl}/game`, {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });
}

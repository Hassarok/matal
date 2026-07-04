import { io, type Socket } from 'socket.io-client';
import { env } from '../config/env';

/**
 * Lazily-created singleton connection to the realtime namespace. The full
 * game client (rooms, events, reconnection UX) is built in Phase 5 — for now
 * this proves the WebSocket transport is wired end-to-end.
 */
let socket: Socket | null = null;

export function getRealtimeSocket(): Socket {
  if (!socket) {
    socket = io(`${env.apiUrl}/realtime`, {
      autoConnect: false,
      transports: ['websocket'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

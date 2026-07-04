import { useEffect, useState } from 'react';
import { getRealtimeSocket } from '../lib/socket';

export type RealtimeState = 'connecting' | 'connected' | 'offline';

/**
 * Connects to the realtime namespace and reports live connection state.
 * Proves the WebSocket transport works end-to-end; Phase 5 expands this into
 * the full game client with reconnection UX and grace periods.
 */
export function useRealtimeStatus(): RealtimeState {
  const [state, setState] = useState<RealtimeState>('connecting');

  useEffect(() => {
    const socket = getRealtimeSocket();

    const onConnect = () => setState('connected');
    const onDisconnect = () => setState('offline');
    const onError = () => setState('offline');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);

    if (!socket.connected) {
      setState('connecting');
      socket.connect();
    } else {
      setState('connected');
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
    };
  }, []);

  return state;
}

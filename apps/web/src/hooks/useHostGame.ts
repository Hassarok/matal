import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  GameEvents,
  type GameCreated,
  type GamePodium,
  type HostQuestionView,
  type LiveQuizInput,
  type LobbyState,
  type QuestionReveal,
} from '@matal/shared-types';
import { createGameSocket } from '@/lib/gameSocket';

export type HostPhase = 'connecting' | 'lobby' | 'question' | 'reveal' | 'ended';

export interface HostGameState {
  phase: HostPhase;
  connected: boolean;
  pin: string | null;
  lobby: LobbyState | null;
  question: HostQuestionView | null;
  reveal: QuestionReveal | null;
  stats: { answeredCount: number; playerCount: number };
  podium: GamePodium | null;
  error: string | null;
}

export interface HostGameControls extends HostGameState {
  start: () => void;
  skip: () => void;
  next: () => void;
  end: () => void;
}

/**
 * Drives a hosted live game over a dedicated socket. The quiz is sent as a
 * snapshot so both guests (local quizzes) and signed-in users host the same
 * way. Pass `null` while the quiz is still loading — the socket connects once a
 * snapshot is available.
 */
export function useHostGame(quiz: LiveQuizInput | null): HostGameControls {
  const socketRef = useRef<Socket | null>(null);
  const gameIdRef = useRef<string | null>(null);

  const [state, setState] = useState<HostGameState>({
    phase: 'connecting',
    connected: false,
    pin: null,
    lobby: null,
    question: null,
    reveal: null,
    stats: { answeredCount: 0, playerCount: 0 },
    podium: null,
    error: null,
  });

  const patch = useCallback(
    (next: Partial<HostGameState>) => setState((prev) => ({ ...prev, ...next })),
    [],
  );

  useEffect(() => {
    // Wait for the quiz snapshot before opening the socket.
    if (!quiz) return;

    const socket = createGameSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      patch({ connected: true });
      if (gameIdRef.current) {
        socket.emit(GameEvents.HostRejoin, { gameId: gameIdRef.current });
      } else {
        socket.emit(GameEvents.HostCreate, { quiz });
      }
    });
    socket.on('disconnect', () => patch({ connected: false }));

    socket.on(GameEvents.GameCreated, (data: GameCreated) => {
      gameIdRef.current = data.gameId;
      patch({ phase: 'lobby', pin: data.pin, lobby: data.lobby, error: null });
    });
    socket.on(GameEvents.LobbyUpdate, (lobby: LobbyState) => patch({ lobby }));
    socket.on(GameEvents.QuestionShow, (question: HostQuestionView) =>
      patch({
        phase: 'question',
        question,
        reveal: null,
        stats: { answeredCount: 0, playerCount: question.playerCount },
      }),
    );
    socket.on(
      GameEvents.QuestionStats,
      (stats: { answeredCount: number; playerCount: number }) => patch({ stats }),
    );
    socket.on(GameEvents.QuestionReveal, (reveal: QuestionReveal) =>
      patch({ phase: 'reveal', reveal }),
    );
    socket.on(GameEvents.GameEnded, (podium: GamePodium) =>
      patch({ phase: 'ended', podium }),
    );
    socket.on(GameEvents.GameError, (err: { message: string }) =>
      patch({ error: err.message }),
    );

    socket.connect();
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [quiz, patch]);

  const emitHost = useCallback((event: string) => {
    if (gameIdRef.current) socketRef.current?.emit(event, { gameId: gameIdRef.current });
  }, []);

  return {
    ...state,
    start: useCallback(() => emitHost(GameEvents.HostStart), [emitHost]),
    skip: useCallback(() => emitHost(GameEvents.HostSkip), [emitHost]),
    next: useCallback(() => emitHost(GameEvents.HostNext), [emitHost]),
    end: useCallback(() => emitHost(GameEvents.HostEnd), [emitHost]),
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  GameEvents,
  type AnswerSubmission,
  type GamePodium,
  type LobbyState,
  type PlayerJoined,
  type PlayerQuestionView,
  type PlayerResult,
  type QuestionReveal,
} from '@matal/shared-types';
import { createGameSocket } from '@/lib/gameSocket';

export type PlayerPhase =
  | 'connecting'
  | 'lobby'
  | 'question'
  | 'reveal'
  | 'ended'
  | 'error';

export interface PlayerGameState {
  phase: PlayerPhase;
  connected: boolean;
  nickname: string | null;
  lobby: LobbyState | null;
  question: PlayerQuestionView | null;
  result: PlayerResult | null;
  reveal: QuestionReveal | null;
  podium: GamePodium | null;
  hasAnswered: boolean;
  error: string | null;
}

export interface PlayerGameControls extends PlayerGameState {
  submitAnswer: (submission: Omit<AnswerSubmission, 'questionIndex'>) => void;
}

function tokenKey(pin: string): string {
  return `matal-player-${pin}`;
}

/** Drives a player's live-game session, with reconnection via a stored token. */
export function usePlayerGame(pin: string, nickname: string): PlayerGameControls {
  const socketRef = useRef<Socket | null>(null);

  const [state, setState] = useState<PlayerGameState>({
    phase: 'connecting',
    connected: false,
    nickname: null,
    lobby: null,
    question: null,
    result: null,
    reveal: null,
    podium: null,
    hasAnswered: false,
    error: null,
  });

  const patch = useCallback(
    (next: Partial<PlayerGameState>) => setState((prev) => ({ ...prev, ...next })),
    [],
  );

  useEffect(() => {
    if (!pin) return;
    const socket = createGameSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      patch({ connected: true });
      const token = sessionStorage.getItem(tokenKey(pin));
      if (token) {
        socket.emit(GameEvents.PlayerRejoin, { pin, playerToken: token });
      } else {
        socket.emit(GameEvents.PlayerJoin, { pin, nickname });
      }
    });
    socket.on('disconnect', () => patch({ connected: false }));

    socket.on(GameEvents.PlayerJoined, (data: PlayerJoined) => {
      sessionStorage.setItem(tokenKey(pin), data.playerToken);
      setState((prev) => ({
        ...prev,
        nickname: data.nickname,
        phase: prev.phase === 'connecting' ? 'lobby' : prev.phase,
        error: null,
      }));
    });
    socket.on(GameEvents.LobbyUpdate, (lobby: LobbyState) => patch({ lobby }));
    socket.on(GameEvents.QuestionShow, (question: PlayerQuestionView) =>
      patch({ phase: 'question', question, result: null, reveal: null, hasAnswered: false }),
    );
    socket.on(GameEvents.PlayerResult, (result: PlayerResult) =>
      patch({ phase: 'reveal', result }),
    );
    socket.on(GameEvents.QuestionReveal, (reveal: QuestionReveal) =>
      patch({ phase: 'reveal', reveal }),
    );
    socket.on(GameEvents.GameEnded, (podium: GamePodium) =>
      patch({ phase: 'ended', podium }),
    );
    socket.on(GameEvents.GameError, (err: { message: string }) =>
      setState((prev) => ({
        ...prev,
        error: err.message,
        phase: prev.phase === 'connecting' ? 'error' : prev.phase,
      })),
    );

    socket.connect();
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [pin, nickname, patch]);

  const submitAnswer = useCallback(
    (submission: Omit<AnswerSubmission, 'questionIndex'>) => {
      setState((prev) => {
        if (prev.hasAnswered || !prev.question) return prev;
        socketRef.current?.emit(GameEvents.PlayerAnswer, {
          ...submission,
          questionIndex: prev.question.index,
        });
        return { ...prev, hasAnswered: true };
      });
    },
    [],
  );

  return { ...state, submitAnswer };
}

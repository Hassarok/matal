import type {
  AnswerSubmission,
  GamePhase,
  QuestionContent,
  QuestionType,
} from '@matal/shared-types';

/** A question snapshot captured when a game starts (immune to later quiz edits). */
export interface LoadedQuestion {
  index: number;
  type: QuestionType;
  prompt: string;
  mediaUrl: string | null;
  explanation: string | null;
  timeLimitSeconds: number;
  points: number;
  content: QuestionContent;
}

export interface PlayerAnswerRecord {
  questionIndex: number;
  correct: boolean;
  points: number;
  responseMs: number;
}

export interface GamePlayerState {
  id: string;
  token: string;
  nickname: string;
  socketId: string | null;
  connected: boolean;
  disconnectedAt: number | null;
  score: number;
  streak: number;
  answers: PlayerAnswerRecord[];
}

export interface RecordedAnswer {
  submission: AnswerSubmission;
  correct: boolean;
  points: number;
  responseMs: number;
}

export interface ActiveQuestion {
  index: number;
  startedAt: number;
  endsAt: number;
  /** playerId → their recorded answer for this question. */
  answers: Map<string, RecordedAnswer>;
}

export interface GameSession {
  id: string;
  pin: string;
  hostId: string;
  hostSocketId: string | null;
  quizId: string | null;
  quizTitle: string;
  questions: LoadedQuestion[];
  phase: GamePhase;
  players: Map<string, GamePlayerState>;
  currentIndex: number; // -1 while in the lobby
  active: ActiveQuestion | null;
  startedAt: number | null;
  createdAt: number;
}

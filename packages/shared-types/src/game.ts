import type { QuestionType } from './enums';

/** Socket.IO event names shared by client and server (single source of truth). */
export const GameEvents = {
  // Host → server
  HostCreate: 'host:create',
  HostStart: 'host:start',
  HostNext: 'host:next',
  HostSkip: 'host:skip',
  HostEnd: 'host:end',
  HostRejoin: 'host:rejoin',
  // Player → server
  PlayerJoin: 'player:join',
  PlayerRejoin: 'player:rejoin',
  PlayerAnswer: 'player:answer',
  // Server → client
  GameCreated: 'game:created',
  LobbyUpdate: 'lobby:update',
  QuestionShow: 'question:show',
  QuestionStats: 'question:stats',
  QuestionReveal: 'question:reveal',
  PlayerJoined: 'player:joined',
  PlayerResult: 'player:result',
  GameEnded: 'game:ended',
  GameError: 'game:error',
} as const;

export interface LobbyPlayer {
  id: string;
  nickname: string;
  connected: boolean;
}

export interface LobbyState {
  pin: string;
  quizTitle: string;
  questionCount: number;
  players: LobbyPlayer[];
}

/** Question as shown to players — never contains the correct answer. */
export interface PlayerQuestionView {
  index: number;
  total: number;
  type: QuestionType;
  prompt: string;
  mediaUrl: string | null;
  timeLimitSeconds: number;
  points: number;
  /** Epoch ms when the answer window closes. */
  endsAt: number;
  /** Present for MULTIPLE_CHOICE / MULTIPLE_SELECT / POLL. */
  options?: { text: string }[];
  /** Present for ORDERING — shuffled; the player restores the correct order. */
  items?: string[];
}

/** Question as shown to the host — includes correct answer + live counts. */
export interface HostQuestionView extends PlayerQuestionView {
  correctOptionIndices?: number[];
  correctAnswer?: boolean;
  acceptableAnswers?: string[];
  correctOrder?: string[];
  answeredCount: number;
  playerCount: number;
}

/** A player's answer submission (server picks the relevant field by type). */
export interface AnswerSubmission {
  questionIndex: number;
  optionIndex?: number; // MULTIPLE_CHOICE, POLL
  optionIndices?: number[]; // MULTIPLE_SELECT
  boolean?: boolean; // TRUE_FALSE
  text?: string; // SHORT_ANSWER
  order?: string[]; // ORDERING
}

/** Per-question result sent to a single player. */
export interface PlayerResult {
  correct: boolean;
  pointsEarned: number;
  totalScore: number;
  rank: number;
  streak: number;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  nickname: string;
  score: number;
}

/** Answer distribution for a question (host reveal). */
export interface AnswerDistribution {
  /** Counts per option index (MC/MS/POLL) or [correct, incorrect] otherwise. */
  buckets: { label: string; count: number; correct: boolean }[];
  answeredCount: number;
}

export interface QuestionReveal {
  index: number;
  distribution: AnswerDistribution;
  leaderboard: LeaderboardEntry[];
}

export interface GamePodium {
  winner: LeaderboardEntry | null;
  top: LeaderboardEntry[];
  finalLeaderboard: LeaderboardEntry[];
  questionCount: number;
  playerCount: number;
}

export interface GameError {
  message: string;
}

/** Returned to the host on create. */
export interface GameCreated {
  gameId: string;
  pin: string;
  lobby: LobbyState;
}

/** Returned to a player on successful join/rejoin. */
export interface PlayerJoined {
  gameId: string;
  playerId: string;
  playerToken: string;
  nickname: string;
}

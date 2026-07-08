/**
 * Canonical enumerations shared across the MATAL platform.
 * These are the single source of truth for both the API and the web client.
 */

/**
 * Platform-level authorization roles.
 * Kept intentionally minimal for now (a standard user and an administrator);
 * additional roles can be introduced later without touching consumers.
 */
export enum UserRole {
  /** A standard registered account (can play, and — from Phase 4 — create). */
  User = 'USER',
  /** Platform administrator. */
  Admin = 'ADMIN',
}

/** Supported question formats in the quiz builder / live game. */
export enum QuestionType {
  MultipleChoice = 'MULTIPLE_CHOICE',
  TrueFalse = 'TRUE_FALSE',
  MultipleSelect = 'MULTIPLE_SELECT',
  ShortAnswer = 'SHORT_ANSWER',
  Poll = 'POLL',
  Ordering = 'ORDERING',
}

/** Quiz difficulty levels. */
export enum Difficulty {
  Easy = 'EASY',
  Medium = 'MEDIUM',
  Hard = 'HARD',
}

/** Who can discover/access a quiz. */
export enum QuizVisibility {
  /** Only the owner. */
  Private = 'PRIVATE',
  /** Listed in public discovery/search. */
  Public = 'PUBLIC',
  /** Accessible via direct link, hidden from discovery. */
  Unlisted = 'UNLISTED',
}

/** Lifecycle state of a hosted live game. */
export enum GameStatus {
  Lobby = 'LOBBY',
  InProgress = 'IN_PROGRESS',
  Paused = 'PAUSED',
  Ended = 'ENDED',
}

/** Fine-grained phase of a live game, used to drive the client UI. */
export enum GamePhase {
  Lobby = 'LOBBY',
  Question = 'QUESTION',
  Reveal = 'REVEAL',
  Ended = 'ENDED',
}

/** Supported interface languages (localization / RTL readiness). */
export enum Locale {
  English = 'en',
  KurdishSorani = 'ckb',
  KurdishKurmanji = 'kmr',
  Arabic = 'ar',
}

/** Text direction associated with a locale. */
export enum TextDirection {
  LTR = 'ltr',
  RTL = 'rtl',
}

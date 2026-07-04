/**
 * Canonical enumerations shared across the MATAL platform.
 * These are the single source of truth for both the API and the web client.
 */

/** Platform-level authorization roles. */
export enum UserRole {
  Guest = 'GUEST',
  Player = 'PLAYER',
  Host = 'HOST',
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

/** Lifecycle state of a hosted live game. */
export enum GameStatus {
  Lobby = 'LOBBY',
  InProgress = 'IN_PROGRESS',
  Paused = 'PAUSED',
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

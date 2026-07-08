/**
 * @matal/shared-types
 * Framework-agnostic domain types & transport contracts shared by the
 * MATAL API and web client. Keep this package free of runtime dependencies.
 *
 * Note: explicit named re-exports (rather than `export *`) are used so that
 * bundlers consuming the CommonJS build can statically detect every named
 * export — `export *` compiles to a runtime helper that Rollup cannot trace.
 */

// Runtime values (enums)
export {
  UserRole,
  QuestionType,
  Difficulty,
  QuizVisibility,
  GameStatus,
  GamePhase,
  Locale,
  TextDirection,
} from './enums';
export { GameEvents } from './game';

// Type-only contracts (erased at runtime)
export type {
  ApiSuccess,
  ApiError,
  ApiErrorCode,
  ApiResponse,
  PaginationMeta,
  Paginated,
} from './api';
export type { HealthStatus, ServiceState } from './health';
export type { PublicUser } from './user';
export type { MessageResponse, SessionResponse } from './auth';
export type {
  ChoiceOption,
  QuestionContent,
  PublicQuestion,
  PublicCategory,
  QuizListItem,
  QuizDetail,
} from './quiz';
export type {
  LobbyPlayer,
  LobbyState,
  PlayerQuestionView,
  HostQuestionView,
  AnswerSubmission,
  PlayerResult,
  LeaderboardEntry,
  AnswerDistribution,
  QuestionReveal,
  GamePodium,
  GameSummary,
  GameError,
  GameCreated,
  PlayerJoined,
} from './game';

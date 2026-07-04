/**
 * Injection tokens for the AI capability contracts. Consumers inject by token,
 * e.g. `@Inject(QUIZ_GENERATOR) private readonly generator: QuizGenerator`.
 * Keeping tokens separate from interfaces avoids circular imports.
 */
export const QUIZ_GENERATOR = Symbol('QUIZ_GENERATOR');
export const QUESTION_SUGGESTER = Symbol('QUESTION_SUGGESTER');
export const CONTENT_MODERATOR = Symbol('CONTENT_MODERATOR');
export const TRANSLATOR = Symbol('TRANSLATOR');
export const DIFFICULTY_ANALYZER = Symbol('DIFFICULTY_ANALYZER');

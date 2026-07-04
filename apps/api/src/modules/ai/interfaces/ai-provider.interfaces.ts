import type { Difficulty, Locale, QuestionType } from '@matal/shared-types';

/**
 * ─────────────────────────────────────────────────────────────────────────
 * AI capability contracts (future-readiness seam)
 * ─────────────────────────────────────────────────────────────────────────
 * MATAL ships without AI features today, but the architecture reserves clean
 * boundaries for them. Feature modules depend on these interfaces (via the
 * tokens in `ai.tokens.ts`), never on a concrete provider. Adding real AI
 * later — an LLM-backed generator, a moderation service, etc. — means binding
 * an implementation in `AiModule`; no consumer code changes.
 */

export interface GenerateQuizRequest {
  topic: string;
  questionCount: number;
  difficulty: Difficulty;
  questionTypes?: QuestionType[];
  locale?: Locale;
}

export interface GeneratedQuestionDraft {
  type: QuestionType;
  prompt: string;
  options: string[];
  correctAnswers: number[];
  explanation?: string;
}

export interface GeneratedQuizDraft {
  title: string;
  description: string;
  questions: GeneratedQuestionDraft[];
}

/** Automatic quiz generation from a topic/prompt. */
export interface QuizGenerator {
  generateQuiz(request: GenerateQuizRequest): Promise<GeneratedQuizDraft>;
}

/** Inline question/answer suggestions while authoring. */
export interface QuestionSuggester {
  suggestQuestions(
    topic: string,
    count: number,
    locale?: Locale,
  ): Promise<GeneratedQuestionDraft[]>;
}

export type ModerationCategory =
  | 'hate'
  | 'harassment'
  | 'sexual'
  | 'violence'
  | 'self-harm'
  | 'spam';

export interface ModerationResult {
  flagged: boolean;
  categories: ModerationCategory[];
  score: number;
}

/** Automated content moderation for user-generated quizzes. */
export interface ContentModerator {
  moderate(text: string): Promise<ModerationResult>;
}

/** Machine translation of quiz content between supported locales. */
export interface Translator {
  translate(text: string, from: Locale, to: Locale): Promise<string>;
}

/** Difficulty estimation for a question, e.g. from historical answer stats. */
export interface DifficultyAnalyzer {
  estimateDifficulty(prompt: string, options: string[]): Promise<Difficulty>;
}

import type { Difficulty, QuestionType, QuizVisibility } from './enums';

/** A selectable option in choice-style questions. */
export interface ChoiceOption {
  text: string;
  correct: boolean;
}

/** Type-specific payload for a question, discriminated by {@link QuestionType}. */
export type QuestionContent =
  | { options: ChoiceOption[] } // MULTIPLE_CHOICE, MULTIPLE_SELECT
  | { correctAnswer: boolean } // TRUE_FALSE
  | { acceptableAnswers: string[] } // SHORT_ANSWER
  | { options: { text: string }[] } // POLL
  | { items: string[] }; // ORDERING — stored in the correct order

export interface PublicQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  mediaUrl: string | null;
  explanation: string | null;
  timeLimitSeconds: number;
  points: number;
  order: number;
  content: QuestionContent;
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

/** Lightweight quiz representation for lists/cards. */
export interface QuizListItem {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  difficulty: Difficulty;
  visibility: QuizVisibility;
  tags: string[];
  category: PublicCategory | null;
  questionCount: number;
  updatedAt: string;
  createdAt: string;
}

/** Full quiz including its questions — used by the builder. */
export interface QuizDetail extends QuizListItem {
  ownerId: string;
  categoryId: string | null;
  questions: PublicQuestion[];
}

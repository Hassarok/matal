import { z } from 'zod';
import { Difficulty, QuestionType, QuizVisibility } from '@matal/shared-types';

/** Fields common to every question type. */
const baseQuestion = {
  prompt: z.string().trim().min(1, 'Question text is required.').max(500),
  mediaUrl: z.string().url('Enter a valid URL.').max(2048).optional().or(z.literal('')),
  explanation: z.string().trim().max(500).optional().or(z.literal('')),
  timeLimitSeconds: z.coerce.number().int().min(5).max(300).default(20),
  points: z.coerce.number().int().min(0).max(2000).default(1000),
};

const choiceOption = z.object({
  text: z.string().trim().min(1, 'Option text is required.').max(200),
  correct: z.boolean(),
});

const pollOption = z.object({
  text: z.string().trim().min(1, 'Option text is required.').max(200),
});

/**
 * A question, discriminated by `type`. Shape is validated by the discriminated
 * union; cross-field correctness (e.g. "exactly one correct answer") is added
 * via superRefine below.
 */
const questionUnion = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(QuestionType.MultipleChoice),
    ...baseQuestion,
    options: z.array(choiceOption).min(2, 'Add at least two options.').max(6),
  }),
  z.object({
    type: z.literal(QuestionType.TrueFalse),
    ...baseQuestion,
    correctAnswer: z.boolean(),
  }),
  z.object({
    type: z.literal(QuestionType.MultipleSelect),
    ...baseQuestion,
    options: z.array(choiceOption).min(2, 'Add at least two options.').max(6),
  }),
  z.object({
    type: z.literal(QuestionType.ShortAnswer),
    ...baseQuestion,
    acceptableAnswers: z
      .array(z.string().trim().min(1, 'Answer cannot be empty.').max(100))
      .min(1, 'Add at least one accepted answer.')
      .max(10),
  }),
  z.object({
    type: z.literal(QuestionType.Poll),
    ...baseQuestion,
    options: z.array(pollOption).min(2, 'Add at least two options.').max(6),
  }),
  z.object({
    type: z.literal(QuestionType.Ordering),
    ...baseQuestion,
    items: z
      .array(z.string().trim().min(1, 'Item cannot be empty.').max(200))
      .min(2, 'Add at least two items to order.')
      .max(6),
  }),
]);

export const questionSchema = questionUnion.superRefine((question, ctx) => {
  if (question.type === QuestionType.MultipleChoice) {
    const correct = question.options.filter((o) => o.correct).length;
    if (correct !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Mark exactly one option as correct.',
      });
    }
  }
  if (question.type === QuestionType.MultipleSelect) {
    if (!question.options.some((o) => o.correct)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Mark at least one option as correct.',
      });
    }
  }
});

export type QuestionInput = z.infer<typeof questionSchema>;

/** Quiz metadata (no questions). */
export const quizMetaSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(120),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  coverImageUrl: z.string().url('Enter a valid URL.').max(2048).optional().or(z.literal('')),
  categoryId: z.string().min(1).nullable().optional(),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.Medium),
  visibility: z.nativeEnum(QuizVisibility).default(QuizVisibility.Private),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
});

/** Full quiz payload used to create or replace a quiz (metadata + questions). */
export const saveQuizSchema = quizMetaSchema.extend({
  questions: z.array(questionSchema).max(100).default([]),
});
export type SaveQuizInput = z.infer<typeof saveQuizSchema>;

/** How a quiz list is ordered. */
export const quizSortOptions = ['recent', 'oldest', 'title'] as const;
export type QuizSort = (typeof quizSortOptions)[number];

/** Query params for listing/searching the current user's quizzes. */
export const quizListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().max(100).optional(),
  categoryId: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  sort: z.enum(quizSortOptions).default('recent'),
});
export type QuizListQuery = z.infer<typeof quizListQuerySchema>;

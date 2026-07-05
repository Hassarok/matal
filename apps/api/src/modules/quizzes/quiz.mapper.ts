import { Prisma } from '@prisma/client';
import {
  type Difficulty,
  type PublicCategory,
  type PublicQuestion,
  type QuestionContent,
  type QuestionType,
  type QuizDetail,
  type QuizListItem,
  type QuizVisibility,
} from '@matal/shared-types';

/** Prisma payload shapes the mappers expect. */
export type QuizListRow = Prisma.QuizGetPayload<{
  include: { category: true; _count: { select: { questions: true } } };
}>;
export type QuizDetailRow = Prisma.QuizGetPayload<{
  include: { category: true; questions: true };
}>;
type QuestionRow = QuizDetailRow['questions'][number];
type CategoryRow = NonNullable<QuizListRow['category']>;

function toPublicCategory(category: CategoryRow): PublicCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
  };
}

function toPublicQuestion(question: QuestionRow): PublicQuestion {
  return {
    id: question.id,
    type: question.type as QuestionType,
    prompt: question.prompt,
    mediaUrl: question.mediaUrl,
    explanation: question.explanation,
    timeLimitSeconds: question.timeLimitSeconds,
    points: question.points,
    order: question.order,
    content: question.content as unknown as QuestionContent,
  };
}

export function toQuizListItem(quiz: QuizListRow): QuizListItem {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    coverImageUrl: quiz.coverImageUrl,
    difficulty: quiz.difficulty as Difficulty,
    visibility: quiz.visibility as QuizVisibility,
    tags: quiz.tags,
    category: quiz.category ? toPublicCategory(quiz.category) : null,
    questionCount: quiz._count.questions,
    createdAt: quiz.createdAt.toISOString(),
    updatedAt: quiz.updatedAt.toISOString(),
  };
}

export function toQuizDetail(quiz: QuizDetailRow): QuizDetail {
  const questions = [...quiz.questions].sort((a, b) => a.order - b.order);
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    coverImageUrl: quiz.coverImageUrl,
    difficulty: quiz.difficulty as Difficulty,
    visibility: quiz.visibility as QuizVisibility,
    tags: quiz.tags,
    category: quiz.category ? toPublicCategory(quiz.category) : null,
    questionCount: questions.length,
    createdAt: quiz.createdAt.toISOString(),
    updatedAt: quiz.updatedAt.toISOString(),
    ownerId: quiz.ownerId,
    categoryId: quiz.categoryId,
    questions: questions.map(toPublicQuestion),
  };
}

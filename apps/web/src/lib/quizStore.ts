import type {
  Paginated,
  PublicCategory,
  PublicQuestion,
  QuestionContent,
  QuizDetail,
  QuizListItem,
} from '@matal/shared-types';
import type { QuestionInput, SaveQuizInput } from '@matal/validation';
import { api, type QuizListParams } from '@/lib/api';

/**
 * A store for the current user's quizzes. Guests and signed-in users share the
 * same page workflows through this one interface — the only difference is where
 * the data lives: the API (signed-in) or the browser (guest).
 */
export interface QuizRepository {
  list(params?: QuizListParams): Promise<Paginated<QuizListItem>>;
  get(id: string): Promise<QuizDetail>;
  create(input: SaveQuizInput): Promise<QuizDetail>;
  update(id: string, input: SaveQuizInput): Promise<QuizDetail>;
  duplicate(id: string): Promise<QuizDetail>;
  remove(id: string): Promise<void>;
}

/** Signed-in users: quizzes are persisted server-side via the REST API. */
export const remoteQuizRepository: QuizRepository = {
  list: (params = {}) => api.quizzes.list(params),
  get: (id) => api.quizzes.get(id),
  create: (input) => api.quizzes.create(input),
  update: (id, input) => api.quizzes.update(id, input),
  duplicate: (id) => api.quizzes.duplicate(id),
  remove: (id) => api.quizzes.remove(id),
};

// ── Guest (localStorage-backed) store ────────────────────────────────

const STORAGE_KEY = 'matal.guest.quizzes';

/** Local quiz ids are prefixed so they are never mistaken for server ids. */
export function isLocalId(id: string): boolean {
  return id.startsWith('local-');
}

function localId(): string {
  return `local-${crypto.randomUUID()}`;
}

function readAll(): QuizDetail[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QuizDetail[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(quizzes: QuizDetail[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
  } catch {
    // Ignore quota / serialization failures — guest data is best-effort.
  }
}

function toListItem(quiz: QuizDetail): QuizListItem {
  const { questions: _questions, ownerId: _ownerId, categoryId: _categoryId, ...rest } = quiz;
  return { ...rest, questionCount: quiz.questions.length };
}

/** Splits a validated question into the stored `content` + column fields. */
function toPublicQuestion(question: QuestionInput, order: number): PublicQuestion {
  const { type, prompt, mediaUrl, explanation, timeLimitSeconds, points, ...content } =
    question;
  return {
    id: `local-q-${order}`,
    type,
    prompt,
    mediaUrl: mediaUrl || null,
    explanation: explanation || null,
    timeLimitSeconds,
    points,
    order,
    content: content as unknown as QuestionContent,
  };
}

/** Rebuilds a flat question payload (content merged in) for re-saving. */
function fromPublicQuestion(question: PublicQuestion): Record<string, unknown> {
  return {
    type: question.type,
    prompt: question.prompt,
    mediaUrl: question.mediaUrl ?? undefined,
    explanation: question.explanation ?? undefined,
    timeLimitSeconds: question.timeLimitSeconds,
    points: question.points,
    ...(question.content as unknown as Record<string, unknown>),
  };
}

function buildDetail(
  input: SaveQuizInput,
  categories: PublicCategory[],
  base: { id: string; createdAt: string },
): QuizDetail {
  const category = input.categoryId
    ? (categories.find((c) => c.id === input.categoryId) ?? null)
    : null;
  return {
    id: base.id,
    title: input.title,
    description: input.description || null,
    coverImageUrl: input.coverImageUrl || null,
    difficulty: input.difficulty,
    visibility: input.visibility,
    tags: input.tags,
    category,
    categoryId: input.categoryId ?? null,
    ownerId: 'guest',
    questionCount: input.questions.length,
    createdAt: base.createdAt,
    updatedAt: new Date().toISOString(),
    questions: input.questions.map(toPublicQuestion),
  };
}

/** Reverses a stored guest quiz back into a `SaveQuizInput` (for migration). */
export function detailToSaveInput(quiz: QuizDetail): SaveQuizInput {
  return {
    title: quiz.title,
    description: quiz.description ?? '',
    coverImageUrl: quiz.coverImageUrl ?? '',
    categoryId: quiz.categoryId,
    difficulty: quiz.difficulty,
    visibility: quiz.visibility,
    tags: quiz.tags,
    questions: quiz.questions.map(fromPublicQuestion),
  } as unknown as SaveQuizInput;
}

/**
 * Builds a guest quiz store over localStorage. Categories are captured so list
 * items can show a category badge without a network round-trip.
 */
export function createLocalQuizRepository(categories: PublicCategory[]): QuizRepository {
  const requireQuiz = (id: string): QuizDetail => {
    const quiz = readAll().find((q) => q.id === id);
    if (!quiz) throw new Error('Quiz not found.');
    return quiz;
  };

  return {
    async list(params = {}) {
      const { search, categoryId, difficulty, sort = 'recent', page = 1, pageSize = 12 } =
        params;
      let items = readAll();

      if (search) {
        const needle = search.toLowerCase();
        items = items.filter((q) => q.title.toLowerCase().includes(needle));
      }
      if (categoryId) items = items.filter((q) => q.categoryId === categoryId);
      if (difficulty) items = items.filter((q) => q.difficulty === difficulty);

      items = [...items].sort((a, b) => {
        if (sort === 'title') return a.title.localeCompare(b.title);
        if (sort === 'oldest') return a.createdAt.localeCompare(b.createdAt);
        return b.updatedAt.localeCompare(a.updatedAt);
      });

      const total = items.length;
      const start = (page - 1) * pageSize;
      const pageItems = items.slice(start, start + pageSize).map(toListItem);

      return {
        items: pageItems,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      };
    },

    get(id) {
      return Promise.resolve(requireQuiz(id));
    },

    create(input) {
      const detail = buildDetail(input, categories, {
        id: localId(),
        createdAt: new Date().toISOString(),
      });
      writeAll([detail, ...readAll()]);
      return Promise.resolve(detail);
    },

    update(id, input) {
      const existing = requireQuiz(id);
      const detail = buildDetail(input, categories, {
        id: existing.id,
        createdAt: existing.createdAt,
      });
      writeAll(readAll().map((q) => (q.id === id ? detail : q)));
      return Promise.resolve(detail);
    },

    duplicate(id) {
      const source = requireQuiz(id);
      const copy: QuizDetail = {
        ...source,
        id: localId(),
        title: `${source.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      writeAll([copy, ...readAll()]);
      return Promise.resolve(copy);
    },

    remove(id) {
      writeAll(readAll().filter((q) => q.id !== id));
      return Promise.resolve();
    },
  };
}

// ── Guest → account migration ────────────────────────────────────────

export function hasGuestQuizzes(): boolean {
  return readAll().length > 0;
}

/**
 * Uploads any guest quizzes to the signed-in account, then clears local
 * storage. Best-effort per quiz; returns the number successfully imported.
 * Call once right after a successful login/registration.
 */
export async function migrateGuestQuizzesToAccount(): Promise<number> {
  const quizzes = readAll();
  if (quizzes.length === 0) return 0;

  let imported = 0;
  for (const quiz of quizzes) {
    try {
      await api.quizzes.create(detailToSaveInput(quiz));
      imported += 1;
    } catch {
      // Skip quizzes the server rejects; keep importing the rest.
    }
  }
  writeAll([]);
  return imported;
}

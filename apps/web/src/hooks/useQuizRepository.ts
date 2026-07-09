import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import {
  createLocalQuizRepository,
  remoteQuizRepository,
  type QuizRepository,
} from '@/lib/quizStore';

/**
 * Returns the quiz store for the current visitor: the server-backed store for
 * signed-in users, or a localStorage-backed store for guests. Pages call the
 * same methods regardless, so quiz workflows are shared across both.
 */
export function useQuizRepository(): QuizRepository {
  const { isAuthenticated } = useAuth();
  const categories = useCategories().data;

  return useMemo(
    () => (isAuthenticated ? remoteQuizRepository : createLocalQuizRepository(categories ?? [])),
    [isAuthenticated, categories],
  );
}

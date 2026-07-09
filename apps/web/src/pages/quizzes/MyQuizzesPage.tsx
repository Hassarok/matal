import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  FileQuestion,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Difficulty, type QuizListItem } from '@matal/shared-types';
import type { QuizSort } from '@matal/validation';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toaster';
import { useCategories } from '@/hooks/useCategories';
import { useQuizRepository } from '@/hooks/useQuizRepository';

const DIFFICULTY_BADGE: Record<Difficulty, 'success' | 'accent' | 'destructive'> = {
  [Difficulty.Easy]: 'success',
  [Difficulty.Medium]: 'accent',
  [Difficulty.Hard]: 'destructive',
};

const SORT_LABELS: Record<QuizSort, string> = {
  recent: 'Recently updated',
  oldest: 'Oldest first',
  title: 'Title (A–Z)',
};

function QuizCard({
  quiz,
  onDuplicate,
  onDelete,
}: {
  quiz: QuizListItem;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative h-28 bg-gradient-to-br from-brand-mountain to-brand-sky">
        {quiz.coverImageUrl && (
          <img
            src={quiz.coverImageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute end-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-surface/90"
                aria-label="Quiz actions"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/quizzes/${quiz.id}/edit`}>
                  <Pencil /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDuplicate}>
                <Copy /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={onDelete}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardHeader className="flex-1">
        <CardTitle className="line-clamp-1 text-base">
          <Link
            to={`/quizzes/${quiz.id}`}
            className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {quiz.title}
          </Link>
        </CardTitle>
        {quiz.description && (
          <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Badge variant={DIFFICULTY_BADGE[quiz.difficulty]}>{quiz.difficulty.toLowerCase()}</Badge>
        <Badge variant="secondary">
          {quiz.questionCount} question{quiz.questionCount === 1 ? '' : 's'}
        </Badge>
        {quiz.category && <Badge variant="outline">{quiz.category.name}</Badge>}
      </CardContent>
      <CardFooter>
        <Button
          asChild={quiz.questionCount > 0}
          variant="gradient"
          className="w-full"
          disabled={quiz.questionCount === 0}
          title={quiz.questionCount === 0 ? 'Add a question before hosting' : undefined}
        >
          {quiz.questionCount > 0 ? (
            <Link to={`/host/${quiz.id}`}>
              <Play /> Host live
            </Link>
          ) : (
            <span>
              <Play /> Host live
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function QuizCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-28 w-full rounded-none" />
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </CardContent>
    </Card>
  );
}

export function MyQuizzesPage() {
  const queryClient = useQueryClient();
  const categoriesQuery = useCategories();
  const repo = useQuizRepository();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sort, setSort] = useState<QuizSort>('recent');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Any filter/sort change resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId, difficulty, sort]);

  const listQuery = useQuery({
    queryKey: ['quizzes', { search: debouncedSearch, categoryId, difficulty, sort, page }],
    queryFn: () =>
      repo.list({
        search: debouncedSearch || undefined,
        categoryId: categoryId || undefined,
        difficulty: difficulty || undefined,
        sort,
        page,
      }),
    placeholderData: (prev) => prev,
  });

  const duplicateMutation = useMutation({
    mutationFn: (quizId: string) => repo.duplicate(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz duplicated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (quizId: string) => repo.remove(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz deleted');
    },
    onSettled: () => setDeletingId(null),
  });

  const quizzes = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const isEmpty = !listQuery.isLoading && quizzes.length === 0;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-5xl px-6">
        <TopBar />
        <main className="grid gap-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight">
                My quizzes
              </h1>
              <p className="text-sm text-muted-foreground">
                Create, organise and manage your quizzes.
              </p>
            </div>
            <Button asChild>
              <Link to="/quizzes/new">
                <Plus /> New quiz
              </Link>
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your quizzes"
                className="ps-9"
                aria-label="Search quizzes"
              />
            </div>
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              aria-label="Filter by category"
              className="sm:w-44"
            >
              <option value="">All categories</option>
              {categoriesQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              aria-label="Filter by difficulty"
              className="sm:w-40"
            >
              <option value="">Any difficulty</option>
              {Object.values(Difficulty).map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0) + d.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as QuizSort)}
              aria-label="Sort quizzes"
              className="sm:w-44"
            >
              {(Object.keys(SORT_LABELS) as QuizSort[]).map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </Select>
          </div>

          {/* Results */}
          {listQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <QuizCardSkeleton key={i} />
              ))}
            </div>
          ) : isEmpty ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <FileQuestion className="size-10 text-muted-foreground" />
                <div>
                  <p className="font-semibold">No quizzes yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first quiz to get started.
                  </p>
                </div>
                <Button asChild>
                  <Link to="/quizzes/new">
                    <Plus /> New quiz
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onDuplicate={() => duplicateMutation.mutate(quiz.id)}
                  onDelete={() => setDeletingId(quiz.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight />
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Delete confirmation */}
      <Dialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete quiz?</DialogTitle>
            <DialogDescription>
              This permanently removes the quiz and its questions. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
            >
              <Trash2 /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

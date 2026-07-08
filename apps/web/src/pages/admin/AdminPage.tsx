import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  Gamepad2,
  HelpCircle,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import {
  UserRole,
  type AdminQuizItem,
  type AdminUser,
} from '@matal/shared-types';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toaster';
import { cn } from '@/lib/cn';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <span>
          {loading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <span className="block font-display text-2xl font-extrabold tabular-nums">
              {value ?? 0}
            </span>
          )}
          <span className="block text-xs text-muted-foreground">{label}</span>
        </span>
      </CardContent>
    </Card>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft /> Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next <ChevronRight />
      </Button>
    </div>
  );
}

/** Debounced search input shared by both panels. */
function useDebouncedSearch() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  return { search, setSearch, debounced };
}

function UsersPanel() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { search, setSearch, debounced } = useDebouncedSearch();
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  useEffect(() => setPage(1), [debounced]);

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', { search: debounced, page }],
    queryFn: () => api.admin.users({ search: debounced || undefined, page }),
    placeholderData: (prev) => prev,
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      api.admin.updateUserRole(id, role),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(`${updated.displayName} is now ${updated.role.toLowerCase()}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.admin.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('User deleted');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Delete failed'),
    onSettled: () => setDeleting(null),
  });

  const users = usersQuery.data?.items ?? [];
  const meta = usersQuery.data?.meta;

  return (
    <div className="grid gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, username or email"
          className="ps-9"
          aria-label="Search users"
        />
      </div>

      {usersQuery.isLoading ? (
        Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
      ) : users.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No users found.</p>
      ) : (
        users.map((user) => {
          const isSelf = currentUser?.id === user.id;
          return (
            <div
              key={user.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">{user.displayName}</span>
                  {isSelf && <Badge variant="outline">You</Badge>}
                  {!user.emailVerified && <Badge variant="warning">Unverified</Badge>}
                </div>
                <span className="block truncate text-xs text-muted-foreground">
                  @{user.username} · {user.email}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.quizCount} quiz{user.quizCount === 1 ? '' : 'zes'} · {user.gameCount} game
                  {user.gameCount === 1 ? '' : 's'}
                </span>
              </div>
              <Select
                value={user.role}
                disabled={isSelf || roleMutation.isPending}
                aria-label={`Role for ${user.displayName}`}
                className="w-32"
                onChange={(e) =>
                  roleMutation.mutate({ id: user.id, role: e.target.value as UserRole })
                }
              >
                <option value={UserRole.User}>User</option>
                <option value={UserRole.Admin}>Admin</option>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${user.displayName}`}
                disabled={isSelf}
                onClick={() => setDeleting(user)}
              >
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          );
        })
      )}

      <Pagination page={page} totalPages={meta?.totalPages ?? 1} onChange={setPage} />

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              This permanently deletes <strong>{deleting?.displayName}</strong> along with their
              quizzes and hosted games. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            >
              <Trash2 /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuizzesPanel() {
  const queryClient = useQueryClient();
  const { search, setSearch, debounced } = useDebouncedSearch();
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<AdminQuizItem | null>(null);

  useEffect(() => setPage(1), [debounced]);

  const quizzesQuery = useQuery({
    queryKey: ['admin', 'quizzes', { search: debounced, page }],
    queryFn: () => api.admin.quizzes({ search: debounced || undefined, page }),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.admin.deleteQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Quiz deleted');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Delete failed'),
    onSettled: () => setDeleting(null),
  });

  const quizzes = quizzesQuery.data?.items ?? [];
  const meta = quizzesQuery.data?.meta;

  return (
    <div className="grid gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search quizzes by title"
          className="ps-9"
          aria-label="Search quizzes"
        />
      </div>

      {quizzesQuery.isLoading ? (
        Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
      ) : quizzes.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No quizzes found.</p>
      ) : (
        quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{quiz.title}</span>
              <span className="block truncate text-xs text-muted-foreground">
                by {quiz.ownerName} · {quiz.questionCount} question
                {quiz.questionCount === 1 ? '' : 's'}
              </span>
            </div>
            <Badge variant="outline" className="lowercase">
              {quiz.visibility.toLowerCase()}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${quiz.title}`}
              onClick={() => setDeleting(quiz)}
            >
              <Trash2 className="text-destructive" />
            </Button>
          </div>
        ))
      )}

      <Pagination page={page} totalPages={meta?.totalPages ?? 1} onChange={setPage} />

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete quiz?</DialogTitle>
            <DialogDescription>
              This permanently removes <strong>{deleting?.title}</strong> and its questions. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            >
              <Trash2 /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type Tab = 'users' | 'quizzes';

/** Admin control center: platform stats, user management and quiz moderation. */
export function AdminPage() {
  const [tab, setTab] = useState<Tab>('users');
  const statsQuery = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api.admin.stats() });
  const stats = statsQuery.data;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-4xl px-6">
        <TopBar />
        <main className="grid gap-6 py-6">
          <div>
            <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
              <ShieldCheck className="size-6 text-primary" /> Admin
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage users, moderate quizzes and keep an eye on the platform.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Users className="size-5" />}
              label="Users"
              value={stats?.totalUsers}
              loading={statsQuery.isLoading}
            />
            <StatCard
              icon={<FileQuestion className="size-5" />}
              label="Quizzes"
              value={stats?.totalQuizzes}
              loading={statsQuery.isLoading}
            />
            <StatCard
              icon={<HelpCircle className="size-5" />}
              label="Questions"
              value={stats?.totalQuestions}
              loading={statsQuery.isLoading}
            />
            <StatCard
              icon={<Gamepad2 className="size-5" />}
              label="Games"
              value={stats?.totalGames}
              loading={statsQuery.isLoading}
            />
          </div>

          {/* Tab switch */}
          <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
            {(['users', 'quizzes'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 rounded-md py-2 text-sm font-semibold capitalize transition-colors',
                  tab === t
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'users' ? <UsersPanel /> : <QuizzesPanel />}
        </main>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Gamepad2, History, LibraryBig, Plus, Trophy, Users } from 'lucide-react';
import type { GameSummary, QuizListItem } from '@matal/shared-types';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

function QuickAction({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/50 hover:bg-surface-muted"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
        {icon}
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{description}</span>
      </span>
    </Link>
  );
}

function RecentQuiz({ quiz }: { quiz: QuizListItem }) {
  return (
    <Link
      to={`/quizzes/${quiz.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-muted"
    >
      <span className="min-w-0">
        <span className="block truncate font-medium">{quiz.title}</span>
        <span className="text-xs text-muted-foreground">
          {quiz.questionCount} question{quiz.questionCount === 1 ? '' : 's'}
        </span>
      </span>
      <Badge variant="secondary" className="shrink-0 lowercase">
        {quiz.difficulty.toLowerCase()}
      </Badge>
    </Link>
  );
}

function RecentGame({ game }: { game: GameSummary }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <span className="min-w-0">
        <span className="block truncate font-medium">{game.quizTitle}</span>
        <span className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" /> {game.playerCount}
          </span>
          {game.winnerNickname && (
            <span className="inline-flex items-center gap-1">
              <Trophy className="size-3 text-brand-sun" /> {game.winnerNickname}
            </span>
          )}
        </span>
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {new Date(game.endedAt).toLocaleDateString()}
      </span>
    </div>
  );
}

/**
 * Authenticated home. Greets the user and surfaces quick actions plus their
 * most recent quizzes and hosted games.
 */
export function DashboardPage() {
  const { user } = useAuth();

  const quizzesQuery = useQuery({
    queryKey: ['quizzes', { dashboard: true }],
    queryFn: () => api.quizzes.list({ pageSize: 5, sort: 'recent' }),
  });
  const gamesQuery = useQuery({
    queryKey: ['games', 'history', { dashboard: true }],
    queryFn: () => api.games.history({ pageSize: 5 }),
  });

  const quizzes = quizzesQuery.data?.items ?? [];
  const games = gamesQuery.data?.items ?? [];

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-5xl px-6">
        <TopBar />
        <main className="grid gap-8 py-6">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              Welcome back{user ? `, ${user.displayName}` : ''} 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              Create a quiz, host a live game, or pick up where you left off.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <QuickAction
              to="/quizzes/new"
              icon={<Plus className="size-5" />}
              title="New quiz"
              description="Build from scratch"
            />
            <QuickAction
              to="/quizzes"
              icon={<LibraryBig className="size-5" />}
              title="My quizzes"
              description="Manage & host"
            />
            <QuickAction
              to="/join"
              icon={<Gamepad2 className="size-5" />}
              title="Join a game"
              description="Enter a PIN"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent quizzes */}
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div className="grid gap-1">
                  <CardTitle className="text-base">Recent quizzes</CardTitle>
                  <CardDescription>Your latest work</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/quizzes">View all</Link>
                </Button>
              </CardHeader>
              <CardContent className="grid gap-2">
                {quizzesQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))
                ) : quizzes.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <LibraryBig className="size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No quizzes yet — create your first one.
                    </p>
                    <Button asChild size="sm">
                      <Link to="/quizzes/new">
                        <Plus /> New quiz
                      </Link>
                    </Button>
                  </div>
                ) : (
                  quizzes.map((quiz) => <RecentQuiz key={quiz.id} quiz={quiz} />)
                )}
              </CardContent>
            </Card>

            {/* Recent games */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent games</CardTitle>
                <CardDescription>Games you&apos;ve hosted</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {gamesQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))
                ) : games.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <History className="size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No games hosted yet. Host a quiz to see results here.
                    </p>
                  </div>
                ) : (
                  games.map((game) => <RecentGame key={game.id} game={game} />)
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

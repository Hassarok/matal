import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  HelpCircle,
  Trophy,
  Users,
} from 'lucide-react';
import type { GameSummary, HostAnalytics } from '@matal/shared-types';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/lib/api';

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <span>
          <span className="block font-display text-2xl font-extrabold tabular-nums">{value}</span>
          <span className="block text-xs text-muted-foreground">{label}</span>
        </span>
      </CardContent>
    </Card>
  );
}

function GameRow({ game }: { game: GameSummary }) {
  return (
    <Link
      to={`/games/${game.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-muted"
    >
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
          <span>{new Date(game.endedAt).toLocaleDateString()}</span>
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

/**
 * Reports & analytics home: cross-game stats plus the full, paginated list of
 * completed games, each linking to its detailed report.
 */
export function ReportsPage() {
  const [page, setPage] = useState(1);

  const analyticsQuery = useQuery({
    queryKey: ['games', 'analytics'],
    queryFn: () => api.games.analytics(),
  });
  const historyQuery = useQuery({
    queryKey: ['games', 'history', { page }],
    queryFn: () => api.games.history({ page, pageSize: 10 }),
    placeholderData: (prev) => prev,
  });

  const analytics: HostAnalytics | undefined = analyticsQuery.data;
  const games = historyQuery.data?.items ?? [];
  const meta = historyQuery.data?.meta;
  const isEmpty = !historyQuery.isLoading && games.length === 0;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-4xl px-6">
        <TopBar />
        <main className="grid gap-6 py-6">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">
              Reports &amp; analytics
            </h1>
            <p className="text-sm text-muted-foreground">
              Insights from every live game you&apos;ve hosted.
            </p>
          </div>

          {/* Analytics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {analyticsQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : (
              <>
                <StatCard
                  icon={<Gamepad2 className="size-5" />}
                  label="Games hosted"
                  value={analytics?.totalGames ?? 0}
                />
                <StatCard
                  icon={<Users className="size-5" />}
                  label="Players engaged"
                  value={analytics?.totalPlayers ?? 0}
                />
                <StatCard
                  icon={<HelpCircle className="size-5" />}
                  label="Questions played"
                  value={analytics?.totalQuestions ?? 0}
                />
                <StatCard
                  icon={<BarChart3 className="size-5" />}
                  label="Avg. players / game"
                  value={analytics?.averagePlayersPerGame ?? 0}
                />
              </>
            )}
          </div>

          {analytics && analytics.topQuizzes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most-played quizzes</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {analytics.topQuizzes.map((quiz) => (
                  <div
                    key={quiz.quizTitle}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate font-medium">{quiz.quizTitle}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {quiz.timesPlayed} game{quiz.timesPlayed === 1 ? '' : 's'}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Game history */}
          <div className="grid gap-3">
            <h2 className="font-display text-lg font-bold">All games</h2>
            {historyQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : isEmpty ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                  <Gamepad2 className="size-10 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">No games yet</p>
                    <p className="text-sm text-muted-foreground">
                      Host a quiz to start collecting reports.
                    </p>
                  </div>
                  <Button asChild>
                    <Link to="/quizzes">Go to my quizzes</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              games.map((game) => <GameRow key={game.id} game={game} />)
            )}
          </div>

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
    </div>
  );
}

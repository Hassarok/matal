import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, HelpCircle, Timer, Trophy, Users } from 'lucide-react';
import type { QuestionReport } from '@matal/shared-types';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <span>
          <span className="block font-display text-xl font-extrabold tabular-nums">{value}</span>
          <span className="block text-xs text-muted-foreground">{label}</span>
        </span>
      </CardContent>
    </Card>
  );
}

function QuestionRow({ question }: { question: QuestionReport }) {
  const pct = Math.round(question.correctRate * 100);
  return (
    <div className="grid gap-2 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">Question {question.questionIndex + 1}</span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Timer className="size-3" />
          {(question.averageResponseMs / 1000).toFixed(1)}s avg
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
          <div
            className={cn(
              'h-full rounded-full',
              pct >= 50 ? 'bg-success' : 'bg-brand-terracotta',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-28 text-end text-sm tabular-nums text-muted-foreground">
          {question.correctCount}/{question.answerCount} correct ({pct}%)
        </span>
      </div>
    </div>
  );
}

/** Detailed post-game report for a single completed game the user hosted. */
export function GameReportPage() {
  const { id = '' } = useParams();
  const reportQuery = useQuery({
    queryKey: ['game-report', id],
    queryFn: () => api.games.report(id),
  });

  const report = reportQuery.data;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-6">
        <TopBar />
        <main className="grid gap-6 py-6">
          <Button asChild variant="ghost" size="sm" className="w-fit -ms-2">
            <Link to="/reports">
              <ArrowLeft /> Back to reports
            </Link>
          </Button>

          {reportQuery.isLoading ? (
            <div className="grid gap-4">
              <Skeleton className="h-9 w-2/3" />
              <div className="grid gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
              <Skeleton className="h-48 w-full" />
            </div>
          ) : !report ? (
            <Card>
              <CardContent className="py-14 text-center text-muted-foreground">
                This report could not be found.
              </CardContent>
            </Card>
          ) : (
            <>
              <div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight">
                  {report.quizTitle}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Hosted {new Date(report.endedAt).toLocaleString()} · PIN {report.pin}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <Stat icon={<Users className="size-5" />} label="Players" value={report.playerCount} />
                <Stat
                  icon={<HelpCircle className="size-5" />}
                  label="Questions"
                  value={report.questionCount}
                />
                <Stat
                  icon={<Clock className="size-5" />}
                  label="Duration"
                  value={formatDuration(report.durationMs)}
                />
                <Stat
                  icon={<Trophy className="size-5" />}
                  label="Avg. score"
                  value={report.averageScore}
                />
              </div>

              {/* Final standings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Final standings</CardTitle>
                  <CardDescription>
                    {report.winnerNickname
                      ? `${report.winnerNickname} took the crown`
                      : 'No players'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {report.players.map((player) => (
                    <div
                      key={`${player.rank}-${player.nickname}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5"
                    >
                      <span className="w-6 text-center font-display font-bold text-muted-foreground">
                        {player.rank}
                      </span>
                      <span className="flex-1 truncate font-semibold">{player.nickname}</span>
                      <span className="text-xs text-muted-foreground">
                        {player.correctCount}/{report.questionCount} correct
                      </span>
                      <span className="w-16 text-end font-display font-bold tabular-nums">
                        {player.score}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Per-question breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Question breakdown</CardTitle>
                  <CardDescription>How players performed on each question</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {report.questions.map((question) => (
                    <QuestionRow key={question.questionIndex} question={question} />
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

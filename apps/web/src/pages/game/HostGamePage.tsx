import { Link, useParams } from 'react-router-dom';
import { Check, PartyPopper, Play, SkipForward, Trophy, Users, X } from 'lucide-react';
import { QuestionType, type AnswerDistribution } from '@matal/shared-types';
import { StarSpinner } from '@/components/brand/StarSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { CountdownTimer } from '@/components/game/CountdownTimer';
import { Leaderboard } from '@/components/game/Leaderboard';
import { useHostGame, type HostGameControls } from '@/hooks/useHostGame';

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div className="bg-kilim pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-8">
        {children}
      </div>
    </div>
  );
}

function DistributionBars({ distribution }: { distribution: AnswerDistribution }) {
  const max = Math.max(1, ...distribution.buckets.map((b) => b.count));
  return (
    <div className="grid gap-2">
      {distribution.buckets.map((bucket, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-32 truncate text-sm font-medium">{bucket.label}</span>
          <div className="flex-1">
            <div
              className={cn(
                'h-7 rounded-md transition-all',
                bucket.correct ? 'bg-success' : 'bg-brand-mountain/60',
              )}
              style={{ width: `${Math.max(6, (bucket.count / max) * 100)}%` }}
            />
          </div>
          <span className="w-8 text-end text-sm font-semibold tabular-nums">{bucket.count}</span>
        </div>
      ))}
    </div>
  );
}

/** The correct answer(s) for the current question, shown only to the host. */
function AnswerKey({ question }: { question: NonNullable<HostGameControls['question']> }) {
  if (
    (question.type === QuestionType.MultipleChoice ||
      question.type === QuestionType.MultipleSelect) &&
    question.options
  ) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {question.options.map((option, i) => {
          const correct = question.correctOptionIndices?.includes(i);
          return (
            <div
              key={i}
              className={cn(
                'flex items-center gap-2 rounded-lg border-2 px-4 py-3 font-medium',
                correct ? 'border-success bg-success/10' : 'border-border',
              )}
            >
              {correct && <Check className="size-4 text-success" />}
              {option.text}
            </div>
          );
        })}
      </div>
    );
  }
  if (question.type === QuestionType.TrueFalse) {
    return (
      <p className="text-lg font-semibold">
        Answer: <span className="text-success">{question.correctAnswer ? 'True' : 'False'}</span>
      </p>
    );
  }
  if (question.type === QuestionType.ShortAnswer) {
    return (
      <p className="text-lg font-semibold">
        Accepted: <span className="text-success">{question.acceptableAnswers?.join(', ')}</span>
      </p>
    );
  }
  if (question.type === QuestionType.Ordering) {
    return (
      <p className="text-lg font-semibold">
        Order: <span className="text-success">{question.correctOrder?.join(' → ')}</span>
      </p>
    );
  }
  return <p className="text-muted-foreground">Poll — no correct answer.</p>;
}

/**
 * Host control surface for a live game. Creates the game on mount (via the
 * socket hook) and drives it through lobby → question → reveal → podium.
 */
export function HostGamePage() {
  const { quizId = '' } = useParams();
  const game = useHostGame(quizId);

  if (game.error && (game.phase === 'connecting' || !game.pin)) {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <X className="size-12 text-destructive" />
          <p className="text-lg font-semibold">{game.error}</p>
          <Button asChild variant="outline">
            <Link to="/quizzes">Back to my quizzes</Link>
          </Button>
        </div>
      </Screen>
    );
  }

  if (game.phase === 'connecting') {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <StarSpinner />
          <p className="text-muted-foreground">Setting up your game…</p>
        </div>
      </Screen>
    );
  }

  if (game.phase === 'lobby') {
    const players = game.lobby?.players ?? [];
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Join at this device&apos;s screen · Game PIN
            </p>
            <p className="mt-2 font-display text-6xl font-extrabold tracking-[0.15em] text-gradient-sun">
              {game.pin}
            </p>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-5" />
            <span className="font-semibold text-foreground">{players.length}</span> player
            {players.length === 1 ? '' : 's'} joined
          </div>

          <div className="flex max-w-2xl flex-wrap justify-center gap-2">
            {players.map((p) => (
              <Badge
                key={p.id}
                variant={p.connected ? 'secondary' : 'outline'}
                className="text-sm"
              >
                {p.nickname}
              </Badge>
            ))}
            {players.length === 0 && (
              <p className="text-muted-foreground">Waiting for players to join…</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button asChild variant="ghost">
              <Link to="/quizzes">Cancel</Link>
            </Button>
            <Button
              variant="gradient"
              size="lg"
              disabled={players.length === 0}
              onClick={game.start}
            >
              <Play /> Start game
            </Button>
          </div>
          {game.error && <p className="text-sm text-destructive">{game.error}</p>}
        </div>
      </Screen>
    );
  }

  if (game.phase === 'question' && game.question) {
    const q = game.question;
    return (
      <Screen>
        <div className="mb-6 flex items-center justify-between gap-4">
          <Badge variant="secondary">
            Question {q.index + 1} / {q.total}
          </Badge>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Users className="size-4" />
              {game.stats.answeredCount} / {game.stats.playerCount} answered
            </span>
            <CountdownTimer endsAt={q.endsAt} totalSeconds={q.timeLimitSeconds} />
          </div>
        </div>
        <h1 className="mb-8 font-display text-3xl font-bold">{q.prompt}</h1>
        <AnswerKey question={q} />
        <div className="mt-auto flex justify-end pt-8">
          <Button variant="outline" onClick={game.skip}>
            <SkipForward /> Skip to results
          </Button>
        </div>
      </Screen>
    );
  }

  if (game.phase === 'reveal' && game.reveal) {
    const isLast = game.question ? game.question.index + 1 >= game.question.total : false;
    return (
      <Screen>
        <h2 className="mb-4 font-display text-xl font-bold">How everyone answered</h2>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <DistributionBars distribution={game.reveal.distribution} />
          </CardContent>
        </Card>
        <h2 className="mb-3 font-display text-xl font-bold">Leaderboard</h2>
        <Leaderboard entries={game.reveal.leaderboard} limit={5} />
        <div className="mt-auto flex justify-end pt-8">
          <Button variant="gradient" size="lg" onClick={game.next}>
            {isLast ? (
              <>
                <Trophy /> Finish game
              </>
            ) : (
              <>
                <Play /> Next question
              </>
            )}
          </Button>
        </div>
      </Screen>
    );
  }

  if (game.phase === 'ended' && game.podium) {
    const podium = game.podium;
    return (
      <Screen>
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <PartyPopper className="size-12 text-brand-sun" />
          <h1 className="font-display text-3xl font-extrabold">Final results</h1>
          {podium.winner && (
            <p className="flex items-center gap-1.5 text-lg font-semibold">
              <Trophy className="size-5 text-brand-sun" />
              {podium.winner.nickname} wins with {podium.winner.score} points!
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {podium.playerCount} player{podium.playerCount === 1 ? '' : 's'} ·{' '}
            {podium.questionCount} question{podium.questionCount === 1 ? '' : 's'}
          </p>
        </div>
        <Leaderboard entries={podium.finalLeaderboard} />
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link to="/quizzes">Back to my quizzes</Link>
          </Button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex flex-1 items-center justify-center">
        <StarSpinner />
      </div>
    </Screen>
  );
}

import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { Check, PartyPopper, Trophy, X } from 'lucide-react';
import { StarSpinner } from '@/components/brand/StarSpinner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { AnswerInput } from '@/components/game/AnswerInput';
import { CountdownTimer } from '@/components/game/CountdownTimer';
import { Leaderboard } from '@/components/game/Leaderboard';
import { usePlayerGame } from '@/hooks/usePlayerGame';

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div className="bg-kilim pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
        {children}
      </div>
    </div>
  );
}

/**
 * A player's live-game screen. Reached from the join form (which passes the
 * chosen nickname); the socket hook handles join, reconnection and phase flow.
 */
export function PlayGamePage() {
  const { pin = '' } = useParams();
  const location = useLocation();
  const nickname = (location.state as { nickname?: string } | null)?.nickname ?? '';

  // Without a nickname there is nothing to join with — send them to the form.
  const game = usePlayerGame(pin, nickname);

  if (!nickname) {
    return <Navigate to="/join" replace />;
  }

  if (game.phase === 'error') {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <X className="size-12 text-destructive" />
          <p className="text-lg font-semibold">{game.error ?? 'Something went wrong.'}</p>
          <Button asChild variant="outline">
            <Link to="/join">Try another PIN</Link>
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
          <p className="text-muted-foreground">Joining game…</p>
        </div>
      </Screen>
    );
  }

  if (game.phase === 'lobby') {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <div className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            You&apos;re in!
          </div>
          <h1 className="font-display text-3xl font-extrabold">{game.nickname}</h1>
          <p className="text-muted-foreground">
            Waiting for the host to start
            {game.lobby ? ` · ${game.lobby.players.length} in the room` : ''}…
          </p>
          <StarSpinner />
        </div>
      </Screen>
    );
  }

  if (game.phase === 'question' && game.question) {
    return (
      <Screen>
        <div className="mb-6 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Question {game.question.index + 1} of {game.question.total}
          </span>
          <CountdownTimer
            endsAt={game.question.endsAt}
            totalSeconds={game.question.timeLimitSeconds}
          />
        </div>
        <h1 className="mb-6 font-display text-2xl font-bold">{game.question.prompt}</h1>
        {game.hasAnswered ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <Check className="size-12 text-success" />
            <p className="text-lg font-semibold">Answer locked in</p>
            <p className="text-sm text-muted-foreground">Waiting for other players…</p>
          </div>
        ) : (
          <AnswerInput
            question={game.question}
            disabled={game.hasAnswered}
            onSubmit={game.submitAnswer}
          />
        )}
      </Screen>
    );
  }

  if (game.phase === 'reveal') {
    const result = game.result;
    return (
      <Screen>
        {result ? (
          <div
            className={cn(
              'mb-6 flex flex-col items-center gap-2 rounded-xl p-6 text-center',
              result.correct ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
            )}
          >
            {result.correct ? <Check className="size-10" /> : <X className="size-10" />}
            <p className="font-display text-2xl font-extrabold">
              {result.correct ? 'Correct!' : 'Not quite'}
            </p>
            {result.pointsEarned > 0 && (
              <p className="font-semibold">+{result.pointsEarned} points</p>
            )}
            <p className="text-sm text-foreground/70">
              Rank #{result.rank} · {result.totalScore} pts
              {result.streak > 1 ? ` · ${result.streak} streak 🔥` : ''}
            </p>
          </div>
        ) : (
          <p className="mb-6 text-center text-muted-foreground">Answers are in…</p>
        )}
        {game.reveal && (
          <div>
            <h2 className="mb-3 font-display text-lg font-bold">Leaderboard</h2>
            <Leaderboard
              entries={game.reveal.leaderboard}
              highlightNickname={game.nickname}
              limit={5}
            />
          </div>
        )}
      </Screen>
    );
  }

  if (game.phase === 'ended' && game.podium) {
    const mine = game.podium.finalLeaderboard.find((e) => e.nickname === game.nickname);
    return (
      <Screen>
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <PartyPopper className="size-12 text-brand-sun" />
          <h1 className="font-display text-3xl font-extrabold">Game over!</h1>
          {mine && (
            <p className="flex items-center gap-1.5 text-lg font-semibold">
              <Trophy className="size-5 text-brand-sun" />
              You finished #{mine.rank} with {mine.score} points
            </p>
          )}
        </div>
        <Leaderboard
          entries={game.podium.finalLeaderboard}
          highlightNickname={game.nickname}
        />
        <div className="mt-6 text-center">
          <Button asChild variant="outline">
            <Link to="/join">Play another</Link>
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

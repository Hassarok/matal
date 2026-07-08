import { cn } from '@/lib/cn';
import type { LeaderboardEntry } from '@matal/shared-types';

export function Leaderboard({
  entries,
  highlightNickname,
  limit,
}: {
  entries: LeaderboardEntry[];
  highlightNickname?: string | null;
  limit?: number;
}) {
  const shown = limit ? entries.slice(0, limit) : entries;
  return (
    <ol className="space-y-2">
      {shown.map((entry) => {
        const mine = highlightNickname && entry.nickname === highlightNickname;
        return (
          <li
            key={entry.playerId}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-2.5',
              mine ? 'border-primary bg-primary/10' : 'border-border bg-surface',
            )}
          >
            <span className="w-6 text-center font-display font-bold text-muted-foreground">
              {entry.rank}
            </span>
            <span className="flex-1 truncate font-semibold">{entry.nickname}</span>
            <span className="font-display font-bold tabular-nums">{entry.score}</span>
          </li>
        );
      })}
    </ol>
  );
}

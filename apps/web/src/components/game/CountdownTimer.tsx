import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

/** Live countdown to `endsAt` (epoch ms), rendered as a ring with seconds. */
export function CountdownTimer({
  endsAt,
  totalSeconds,
}: {
  endsAt: number;
  totalSeconds: number;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)),
  );

  useEffect(() => {
    const tick = () =>
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  const fraction = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const urgent = remaining <= 5;

  return (
    <div
      className={cn(
        'relative flex h-16 w-16 items-center justify-center rounded-full border-4 font-display text-2xl font-bold tabular-nums transition-colors',
        urgent ? 'border-destructive text-destructive' : 'border-primary text-primary',
      )}
      role="timer"
      aria-label={`${remaining} seconds remaining`}
    >
      {remaining}
      <span
        className="pointer-events-none absolute inset-0 rounded-full opacity-20"
        style={{
          background: `conic-gradient(currentColor ${fraction * 360}deg, transparent 0)`,
        }}
      />
    </div>
  );
}

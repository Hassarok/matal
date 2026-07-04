import { clsx } from 'clsx';

/** MATAL brand lockup: an 8-pointed Kurdish star mark + wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <svg
        viewBox="0 0 64 64"
        className="h-8 w-8"
        role="img"
        aria-label="MATAL"
      >
        <rect width="64" height="64" rx="16" className="fill-brand-mountain" />
        <path
          d="M32 8 L38 20 L52 12 L44 26 L56 32 L44 38 L52 52 L38 44 L32 56 L26 44 L12 52 L20 38 L8 32 L20 26 L12 12 L26 20 Z"
          className="fill-brand-sun"
        />
        <circle cx="32" cy="32" r="7" className="fill-brand-terracotta" />
      </svg>
      <span className="font-display text-xl font-extrabold tracking-tight">
        MATAL
      </span>
    </span>
  );
}

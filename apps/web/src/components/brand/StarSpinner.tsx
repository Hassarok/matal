import { cn } from '@/lib/cn';

/**
 * Brand loading indicator — a slowly rotating 8-pointed star. Used for full
 * moments (route/data loading). For inline button spinners, use the button's
 * built-in `loading` state.
 */
export function StarSpinner({
  className,
  label = 'Loading',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <svg
        viewBox="0 0 64 64"
        className={cn('h-8 w-8 animate-spin text-brand-sun', className)}
        style={{ animationDuration: '2.4s' }}
        aria-hidden
      >
        <path
          d="M32 6 L38 22 L54 12 L44 28 L58 32 L44 36 L54 52 L38 42 L32 58 L26 42 L10 52 L20 36 L6 32 L20 28 L10 12 L26 22 Z"
          className="fill-current"
          opacity="0.9"
        />
        <circle cx="32" cy="32" r="6" className="fill-brand-terracotta" />
      </svg>
      <span className="sr-only">{label}…</span>
    </span>
  );
}

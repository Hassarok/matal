import { cn } from '@/lib/cn';

/**
 * A subtle Kurdish kilim-inspired divider: a horizontal band of repeating
 * diamond/hook motifs. Tasteful and low-contrast — meant to separate sections
 * without shouting. Colour follows `currentColor` (defaults to the sun tone).
 */
export function KilimDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex h-4 w-full items-center text-brand-sun/50', className)}
      aria-hidden
    >
      <svg
        className="h-4 w-full"
        viewBox="0 0 120 16"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
      >
        <defs>
          <pattern
            id="kilim-motif"
            x="0"
            y="0"
            width="20"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M10 2 L14 8 L10 14 L6 8 Z"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
            <path d="M0 8 H4 M16 8 H20" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="120" height="16" fill="url(#kilim-motif)" />
      </svg>
    </div>
  );
}

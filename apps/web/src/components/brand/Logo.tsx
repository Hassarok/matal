import { cn } from '@/lib/cn';
import { StarMark } from './StarMark';

interface LogoProps {
  className?: string;
  /** Hide the wordmark and show only the star mark. */
  markOnly?: boolean;
}

/** MATAL brand lockup: the 8-pointed star mark + wordmark. */
export function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <StarMark className="h-8 w-8" />
      {!markOnly && (
        <span className="font-display text-xl font-extrabold tracking-tight">
          MATAL
        </span>
      )}
    </span>
  );
}

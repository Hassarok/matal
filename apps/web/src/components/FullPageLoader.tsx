import { StarSpinner } from '@/components/brand/StarSpinner';

/** Centered brand loader for route/session transitions. */
export function FullPageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <StarSpinner className="h-10 w-10" />
    </div>
  );
}

import { Toaster as Sonner } from 'sonner';
import { useTheme } from '@/hooks/useTheme';

/** Re-export so features import a single toast API from the design system. */
export { toast } from 'sonner';

/**
 * Themed toast host. Mounted once near the app root. Follows the active MATAL
 * theme and styles toasts with design-system tokens.
 */
export function Toaster() {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            'group flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-foreground shadow-card',
          title: 'text-sm font-semibold',
          description: 'text-sm text-muted-foreground',
          actionButton: 'rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground',
          cancelButton: 'rounded-md bg-surface-muted px-2.5 py-1 text-xs font-medium',
          success: '[&_[data-icon]]:text-success',
          error: '[&_[data-icon]]:text-destructive',
          warning: '[&_[data-icon]]:text-warning',
          info: '[&_[data-icon]]:text-brand-sky',
        },
      }}
    />
  );
}

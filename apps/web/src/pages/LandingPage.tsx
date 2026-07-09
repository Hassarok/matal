import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { TopBar } from '@/components/layout/TopBar';
import { StatusPanel } from '@/components/StatusPanel';
import { Button } from '@/components/ui/button';

/**
 * Phase 1 landing shell, refreshed with the Phase 2 design system.
 * Proves the foundation (theme, i18n/RTL, REST + realtime connectivity) and
 * links to the living style guide. Real product pages arrive in later phases.
 */
export function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      {/* Decorative brand backdrop */}
      <div className="bg-kilim pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -top-32 -end-24 h-96 w-96 rounded-full bg-brand-sun/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -start-24 h-96 w-96 rounded-full bg-brand-terracotta/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-6">
        <TopBar />

        <main className="flex flex-1 flex-col items-center justify-center gap-12 py-10 text-center lg:flex-row lg:justify-between lg:text-start">
          <div className="max-w-2xl animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {t('hero.badge')}
            </span>

            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-gradient-sun">{t('hero.title')}</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              {t('hero.subtitle')}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
              <Button asChild variant="gradient" size="lg">
                <Link to="/quizzes/new">{t('hero.ctaCreate')}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/join">{t('hero.ctaSecondary')}</Link>
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              <Link
                to="/style-guide"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                View the MATAL design system →
              </Link>
            </p>
          </div>

          <div className="animate-float">
            <StatusPanel />
          </div>
        </main>

        <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
          {t('footer.note')}
        </footer>
      </div>
    </div>
  );
}

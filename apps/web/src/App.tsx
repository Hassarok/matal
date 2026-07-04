import { useTranslation } from 'react-i18next';
import { Logo } from './components/Logo';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { StatusPanel } from './components/StatusPanel';

/**
 * Phase 1 landing shell.
 *
 * Its job is to prove the foundation is wired: the MATAL theme (light/dark),
 * i18n with RTL, and live connectivity to both the REST API and the realtime
 * gateway. The real marketing/product pages arrive with the Design System
 * (Phase 2) and beyond.
 */
export default function App() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      {/* Decorative brand backdrop */}
      <div className="bg-kilim pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -top-32 -end-24 h-96 w-96 rounded-full bg-brand-sun/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -start-24 h-96 w-96 rounded-full bg-brand-terracotta/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-6">
        {/* Top bar */}
        <header className="flex items-center justify-between py-6">
          <Logo />
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Hero */}
        <main className="flex flex-1 flex-col items-center justify-center gap-12 py-10 text-center lg:flex-row lg:justify-between lg:text-start">
          <div className="max-w-2xl animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {t('hero.badge')}
            </span>

            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-gradient-sun">{t('hero.title')}</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0 sm:text-lg">
              {t('hero.subtitle')}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-[0.99]"
              >
                {t('hero.ctaPrimary')}
              </button>
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-surface px-6 font-semibold text-foreground transition-colors hover:bg-surface-muted"
              >
                {t('hero.ctaSecondary')}
              </button>
            </div>
          </div>

          <div className="animate-float">
            <StatusPanel />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
          {t('footer.note')}
        </footer>
      </div>
    </div>
  );
}

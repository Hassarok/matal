import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES } from '../i18n';
import { useLocale } from '../hooks/useLocale';

/**
 * Locale selector. Changing the language also flips text direction (LTR/RTL)
 * across the whole app — try Sorani or Arabic to see RTL in action.
 */
export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { locale, changeLocale } = useLocale();

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t('language.label')}</span>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute start-2.5 h-4 w-4 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </svg>
      <select
        value={locale}
        onChange={(event) => void changeLocale(event.target.value)}
        aria-label={t('language.label')}
        className="h-10 cursor-pointer appearance-none rounded-md border border-border bg-surface ps-8 pe-8 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:ring-2"
      >
        {SUPPORTED_LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.nativeName}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute end-2.5 h-4 w-4 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}

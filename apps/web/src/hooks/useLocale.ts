import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { applyDocumentLocale, directionFor } from '../i18n';

/** Convenience hook for reading and changing the active locale + direction. */
export function useLocale() {
  const { i18n } = useTranslation();

  const changeLocale = useCallback(
    async (locale: string) => {
      await i18n.changeLanguage(locale);
      applyDocumentLocale(locale);
    },
    [i18n],
  );

  return {
    locale: i18n.language,
    direction: directionFor(i18n.language),
    changeLocale,
  };
}

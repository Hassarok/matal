import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Locale, TextDirection } from '@matal/shared-types';
import { en } from './locales/en';
import { ar } from './locales/ar';
import { ckb } from './locales/ckb';
import { kmr } from './locales/kmr';

export interface SupportedLocale {
  code: Locale;
  nativeName: string;
  dir: TextDirection;
}

/**
 * The locales the UI can switch between. English is fully translated; the
 * others are partially translated and fall back to English. Direction is
 * driven from here so RTL "just works" for Sorani and Arabic.
 */
export const SUPPORTED_LOCALES: SupportedLocale[] = [
  { code: Locale.English, nativeName: 'English', dir: TextDirection.LTR },
  { code: Locale.KurdishSorani, nativeName: 'کوردیی ناوەندی', dir: TextDirection.RTL },
  { code: Locale.KurdishKurmanji, nativeName: 'Kurmancî', dir: TextDirection.LTR },
  { code: Locale.Arabic, nativeName: 'العربية', dir: TextDirection.RTL },
];

const STORAGE_KEY = 'matal-locale';

export function directionFor(locale: string): TextDirection {
  return (
    SUPPORTED_LOCALES.find((l) => l.code === locale)?.dir ?? TextDirection.LTR
  );
}

function initialLocale(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? Locale.English;
  } catch {
    return Locale.English;
  }
}

/** Syncs <html lang/dir> and persists the choice. Call on every change. */
export function applyDocumentLocale(locale: string): void {
  document.documentElement.lang = locale;
  document.documentElement.dir = directionFor(locale);
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* storage unavailable — non-fatal */
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    [Locale.English]: { translation: en },
    [Locale.KurdishSorani]: { translation: ckb },
    [Locale.KurdishKurmanji]: { translation: kmr },
    [Locale.Arabic]: { translation: ar },
  },
  lng: initialLocale(),
  fallbackLng: Locale.English,
  interpolation: { escapeValue: false },
  returnNull: false,
});

// Apply direction/lang for the initially-selected locale.
applyDocumentLocale(i18n.language);

export default i18n;

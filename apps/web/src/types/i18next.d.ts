import 'i18next';
import type { Translation } from '../i18n/locales/en';

/** Gives `t('...')` full autocomplete & type-checking against the English keys. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: Translation;
    };
  }
}

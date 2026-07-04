import type { Translation } from './en';

/**
 * Recursively-optional translation shape — non-English locales may be partial.
 * Leaf values are widened to `string` because English is declared `as const`
 * (its values are literal types), but translations are of course free text.
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : string;
};

export type PartialTranslation = DeepPartial<Translation>;

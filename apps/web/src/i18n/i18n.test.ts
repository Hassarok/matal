import { describe, expect, it } from 'vitest';
import { Locale, TextDirection } from '@matal/shared-types';
import { SUPPORTED_LOCALES, directionFor } from './index';

describe('i18n direction', () => {
  it('maps Arabic and Sorani to RTL', () => {
    expect(directionFor(Locale.Arabic)).toBe(TextDirection.RTL);
    expect(directionFor(Locale.KurdishSorani)).toBe(TextDirection.RTL);
  });

  it('maps English and Kurmanji to LTR', () => {
    expect(directionFor(Locale.English)).toBe(TextDirection.LTR);
    expect(directionFor(Locale.KurdishKurmanji)).toBe(TextDirection.LTR);
  });

  it('defaults unknown locales to LTR', () => {
    expect(directionFor('xx')).toBe(TextDirection.LTR);
  });

  it('exposes all four supported locales', () => {
    expect(SUPPORTED_LOCALES).toHaveLength(4);
  });
});

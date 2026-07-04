/** English — the source-of-truth locale. Other locales fall back to these keys. */
export const en = {
  brand: {
    tagline: 'Play. Learn. Compete.',
  },
  hero: {
    badge: 'Phase 1 · Foundation ready',
    title: 'Where every quiz is a matal to solve',
    subtitle:
      'A modern, Kurdish-inspired platform for interactive quizzes and live games. Host a room, share a PIN, and bring people together — anywhere in the world.',
    ctaPrimary: 'Explore the vision',
    ctaSecondary: 'Enter a game PIN',
  },
  status: {
    heading: 'System status',
    api: 'REST API',
    realtime: 'Realtime',
    database: 'Database',
    checking: 'Checking…',
    connected: 'Connected',
    degraded: 'Degraded',
    offline: 'Offline',
    version: 'API version',
  },
  theme: {
    toLight: 'Switch to light mode',
    toDark: 'Switch to dark mode',
  },
  language: {
    label: 'Language',
  },
  footer: {
    note: 'MATAL — built with a Kurdish soul, for everyone.',
  },
} as const;

export type Translation = typeof en;

import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * MATAL design-token → Tailwind bridge.
 *
 * Brand colours are fixed; semantic colours (background, surface, foreground…)
 * resolve from CSS variables that flip between light and dark themes (see
 * `src/index.css`). The `rgb(var(--x) / <alpha-value>)` pattern preserves
 * Tailwind opacity modifiers (e.g. `bg-primary/10`).
 *
 * The full component library is delivered in Phase 2 (Design System); this
 * file establishes the token foundation everything else builds on.
 */
const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Fixed brand palette (Kurdish-inspired)
        brand: {
          sun: withOpacity('--matal-sun'),
          terracotta: withOpacity('--matal-terracotta'),
          mountain: withOpacity('--matal-mountain'),
          sky: withOpacity('--matal-sky'),
          pomegranate: withOpacity('--matal-pomegranate'),
          sand: withOpacity('--matal-sand'),
        },
        // Semantic, theme-aware tokens
        background: withOpacity('--color-bg'),
        surface: withOpacity('--color-surface'),
        'surface-muted': withOpacity('--color-surface-muted'),
        foreground: withOpacity('--color-fg'),
        'muted-foreground': withOpacity('--color-fg-muted'),
        border: withOpacity('--color-border'),
        input: withOpacity('--color-border'),
        ring: withOpacity('--color-ring'),
        primary: {
          DEFAULT: withOpacity('--color-primary'),
          foreground: withOpacity('--color-primary-fg'),
        },
        accent: {
          DEFAULT: withOpacity('--color-accent'),
          foreground: withOpacity('--color-accent-fg'),
        },
        // Surface-role tokens (map onto MATAL surfaces to avoid theme drift)
        card: {
          DEFAULT: withOpacity('--color-surface'),
          foreground: withOpacity('--color-fg'),
        },
        popover: {
          DEFAULT: withOpacity('--color-surface'),
          foreground: withOpacity('--color-fg'),
        },
        secondary: {
          DEFAULT: withOpacity('--color-surface-muted'),
          foreground: withOpacity('--color-fg'),
        },
        muted: {
          DEFAULT: withOpacity('--color-surface-muted'),
          foreground: withOpacity('--color-fg-muted'),
        },
        destructive: {
          DEFAULT: withOpacity('--color-danger'),
          foreground: withOpacity('--color-danger-fg'),
        },
        success: withOpacity('--color-success'),
        warning: withOpacity('--color-warning'),
        danger: withOpacity('--color-danger'),
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Sora"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        xl: 'calc(var(--radius) + 6px)',
        '2xl': 'calc(var(--radius) + 12px)',
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgb(20 24 27 / 0.08)',
        card: '0 8px 30px -12px rgb(20 24 27 / 0.18)',
        glow: '0 0 0 1px rgb(var(--matal-sun) / 0.4), 0 8px 30px -8px rgb(var(--matal-sun) / 0.35)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [animate],
} satisfies Config;

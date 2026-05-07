import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        display: ['"Sansita Swashed"', 'cursive'],
        mono: [
          'JetBrains Mono',
          'source-code-pro',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        bg: {
          DEFAULT: 'rgb(var(--bg) / <alpha-value>)',
          soft: 'rgb(var(--bg-soft) / <alpha-value>)',
          panel: 'rgb(var(--bg-panel) / <alpha-value>)',
        },
        fg: {
          DEFAULT: 'rgb(var(--fg) / <alpha-value>)',
          muted: 'rgb(var(--fg-muted) / <alpha-value>)',
          subtle: 'rgb(var(--fg-subtle) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
          contrast: 'rgb(var(--accent-contrast) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          strong: 'rgb(var(--border-strong) / <alpha-value>)',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--accent) / 0.5), 0 8px 32px -8px rgb(var(--accent) / 0.4)',
        glass:
          '0 1px 0 0 rgb(255 255 255 / 0.05) inset, 0 8px 32px -8px rgb(0 0 0 / 0.5)',
      },
      backgroundImage: {
        'radial-spotlight':
          'radial-gradient(80% 60% at 50% 0%, rgb(var(--accent) / 0.18) 0%, transparent 70%)',
        'grid-fade':
          'linear-gradient(to bottom, transparent, rgb(var(--bg) / 1)), repeating-linear-gradient(0deg, rgb(var(--border) / 0.4) 0 1px, transparent 1px 32px), repeating-linear-gradient(90deg, rgb(var(--border) / 0.4) 0 1px, transparent 1px 32px)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 240ms ease-out both',
        shimmer: 'shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;

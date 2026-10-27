import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--muted-foreground) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        brand: '#087CFF',
        navy: '#071426',
        mint: '#00D69A',
        danger: '#FF4655',
        violet: '#8957FF',
      },
      fontFamily: {
        sans: [
          'Segoe UI',
          'Tahoma',
          'Noto Sans Arabic',
          'Noto Sans',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(8, 124, 255, 0.25), 0 20px 60px -20px rgba(8, 124, 255, 0.45)',
        card: '0 24px 60px -36px rgba(2, 12, 27, 0.55)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #087CFF 0%, #8957FF 100%)',
        'hero-glow':
          'radial-gradient(circle at 20% 20%, rgba(8,124,255,0.28), transparent 45%), radial-gradient(circle at 80% 0%, rgba(137,87,255,0.22), transparent 42%), radial-gradient(circle at 60% 90%, rgba(0,214,154,0.15), transparent 45%)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-up': 'fade-up 300ms ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#07070A',
          dark: '#050508',
          card: '#0D0E15',
          elevated: '#121420',
        },
        surface: {
          glass: 'rgba(255, 255, 255, 0.04)',
          glassHover: 'rgba(255, 255, 255, 0.08)',
          glassBorder: 'rgba(255, 255, 255, 0.08)',
          glassBorderActive: 'rgba(124, 58, 237, 0.4)',
        },
        julie: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          electric: '#38BDF8',
          cyan: '#06B6D4',
          accent: '#6366F1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'orb-idle': '0 0 40px rgba(139, 92, 246, 0.35), 0 0 80px rgba(56, 189, 248, 0.2)',
        'orb-active': '0 0 60px rgba(139, 92, 246, 0.6), 0 0 120px rgba(56, 189, 248, 0.45)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-button': '0 4px 20px rgba(124, 58, 237, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'spin-reverse': 'spin 16s linear infinite reverse',
        'waveform': 'wave 1.2s ease-in-out infinite alternate',
      },
      keyframes: {
        wave: {
          '0%': { height: '6px' },
          '100%': { height: '32px' },
        },
      },
    },
  },
  plugins: [],
}

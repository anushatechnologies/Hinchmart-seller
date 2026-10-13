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
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Primary Brand Orange
          600: '#ea580c', // Darker Orange / Active Hover
          700: '#c2410c', // Deep Orange
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
          DEFAULT: '#f97316',
        },
        hinch: {
          green: '#16a34a',
          'green-dark': '#15803d',
          'green-light': '#f0fdf4',
          'green-surface': '#dcfce7',
          orange: '#f97316',
          'orange-light': '#fff7ed',
          amber: '#f59e0b',
          'amber-light': '#fef3c7',
          red: '#ef4444',
          'red-light': '#fef2f2',
          bg: '#f9fafb',
          card: '#ffffff',
          border: '#e5e7eb',
          'text-primary': '#111827',
          'text-secondary': '#6b7280',
          'text-muted': '#9ca3af',
        },
        slate: {
          850: '#151f32',
          900: '#0f172a',
          950: '#080d1a',
        },
        industrial: {
          green: '#16a34a',
          orange: '#f97316',
          steel: '#475569',
          dark: '#0f172a',
          card: '#ffffff',
          border: '#e5e7eb',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 8px -2px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 0 0 1px rgba(249, 115, 22, 0.35), 0 8px 24px -4px rgba(15, 23, 42, 0.12)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'xs': '3px',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}

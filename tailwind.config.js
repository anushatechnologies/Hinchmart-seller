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
        // HinchMart Official Logo Brand Palette: Radiant Gold & Warm Amber
        brand: {
          50: '#fffdf5',
          100: '#fef7dd',
          200: '#feedb2',
          300: '#fed976',
          400: '#f59e0b',
          500: '#d97706', // Primary Logo Warm Gold
          600: '#b45309', // Deep Burnished Gold / Active
          700: '#92400e', // Antique Gold
          800: '#78350f',
          900: '#451a03',
          950: '#260e02',
          DEFAULT: '#d97706',
        },
        // Rich Metallic Gold
        gold: {
          50: '#fffdf5',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#d4af37', // Official Metallic Gold
          600: '#c59b27',
          700: '#b8860b', // Dark Goldenrod
          800: '#996515',
          900: '#704214',
          DEFAULT: '#d4af37',
        },
        // Deep Obsidian Black from Logo 'H' & Structural Frames
        obsidian: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#18181b',
          900: '#0f172a',
          950: '#090d16', // Deep Obsidian Black
          DEFAULT: '#090d16',
        },
        // Re-aligning default orange scale to Logo Gold/Amber for seamless site-wide theme cohesion
        orange: {
          50: '#fffdf5',
          100: '#fef7dd',
          200: '#feedb2',
          300: '#fed976',
          400: '#f59e0b',
          500: '#d97706', // Logo Gold / Amber Primary
          600: '#b45309', // Hover / Deep Gold
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
          950: '#260e02',
        },
        hinch: {
          gold: '#d97706',
          'gold-light': '#fef3c7',
          'gold-dark': '#b45309',
          black: '#090d16',
          dark: '#0f172a',
          green: '#16a34a', // Potted plant emerald accent
          'green-dark': '#15803d',
          'green-light': '#f0fdf4',
          'green-surface': '#dcfce7',
          red: '#ef4444',
          'red-light': '#fef2f2',
          bg: '#fcfbf7', // Logo matching warm subtle ivory
          card: '#ffffff',
          border: '#e7e5e4',
          'text-primary': '#090d16',
          'text-secondary': '#64748b',
          'text-muted': '#94a3b8',
        },
        slate: {
          850: '#111827',
          900: '#0b1120',
          950: '#050811',
        },
        industrial: {
          green: '#16a34a',
          gold: '#d97706',
          orange: '#d97706',
          steel: '#475569',
          dark: '#090d16',
          card: '#ffffff',
          border: '#e7e5e4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 8px -2px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 0 0 1px rgba(217, 119, 6, 0.35), 0 8px 24px -4px rgba(9, 13, 22, 0.12)',
        'gold-glow': '0 0 20px -3px rgba(217, 119, 6, 0.35)',
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

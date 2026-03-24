import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{vue,ts,js}',
    './components/**/*.{vue,ts,js}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f1117',
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d8e2',
          300: '#b1b7c8',
          400: '#8790a9',
          500: '#68728f',
          600: '#535b76',
          700: '#444a60',
          800: '#3b4051',
          900: '#1a1d27',
          950: '#0f1117',
        },
        accent: {
          DEFAULT: '#6366f1',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config

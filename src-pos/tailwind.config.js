/** @type {import('tailwindcss').Config} */
export default {
  important: '#root',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pos: {
          dark: '#0b0f19',
          card: '#131b2e',
          cardHover: '#1c2640',
          border: '#23304d',
          accent: '#3b82f6',
          accentHover: '#2563eb',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          textMuted: '#94a3b8',
        }
      },
      fontFamily: {
        sans: ['"BPG DejaVu Sans"', '"DejaVu Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      screens: {
        'print': { 'raw': 'print' },
      }
    },
  },
  plugins: [],
}

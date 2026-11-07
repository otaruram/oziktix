/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#070a12',
        surface: {
          DEFAULT: '#0d121f',
          elevated: '#121829',
          muted: '#182137',
        },
        hallmark: {
          bg: '#070a12',
          surface: '#0d121f',
          elevated: '#121829',
          border: 'rgba(255, 255, 255, 0.08)',
          borderStrong: 'rgba(255, 255, 255, 0.16)',
          emerald: '#34d399',
          amber: '#fbbf24',
          rose: '#f43f5e',
          cyan: '#38bdf8',
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}

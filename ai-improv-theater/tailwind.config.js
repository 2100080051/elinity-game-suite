/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        theater: {
          bg: '#0b0220',
          purple: '#6d28d9',
          neonPink: '#ff2d8d',
          neonGold: '#f6c453',
        }
      }
    }
  },
  plugins: [],
}

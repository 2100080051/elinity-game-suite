/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        night: '#0b1220',
        mist: '#0f172a',
        cloud: '#cbd5e1',
        glow: '#a78bfa',
        mint: '#6ee7f9',
        blush: '#f472b6',
        panel: 'rgba(255,255,255,0.06)',
        ink: '#e2e8f0'
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    },
  },
  plugins: [],
}

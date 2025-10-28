/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#0ff',
          pink: '#ff2d8d',
          gold: '#FFD88E',
          crimson: '#D72638',
        }
      },
      fontFamily: {
        tech: ['"Rajdhani"', 'sans-serif'],
        display: ['"Orbitron"', 'sans-serif'],
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif']
      }
    },
  },
  plugins: [],
}

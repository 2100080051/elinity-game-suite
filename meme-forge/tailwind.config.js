/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        pop: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        neon: '#22d3ee',
        ink: '#0f172a',
      },
      fontFamily: {
        display: ['Impact', 'Anton', 'Bebas Neue', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        bubble: '0 10px 30px rgba(0,0,0,0.35)'
      }
    },
  },
  plugins: [],
};

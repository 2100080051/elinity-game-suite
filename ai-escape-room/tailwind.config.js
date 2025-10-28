/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          50: '#f3f6fb',
          100: '#e6edf7',
          200: '#c7d8eb',
          300: '#9cb9d9',
          400: '#6d93c4',
          500: '#4b74ab',
          600: '#395b8a',
          700: '#2f496f',
          800: '#283d5c',
          900: '#21324b',
        },
      },
      boxShadow: {
        neon: '0 0 30px rgba(77, 148, 255, 0.35)',
      },
    },
  },
  plugins: [],
};

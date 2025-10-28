/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        dream: {
          50: '#f5f7ff',
          100: '#eaefff',
          200: '#d7dbff',
          300: '#b7bafc',
          400: '#8e8cf7',
          500: '#6c64f1',
          600: '#5949de',
          700: '#4a39b8',
          800: '#392f8a',
          900: '#2d286b',
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(108, 100, 241, 0.35)',
      },
    },
  },
  plugins: [],
};

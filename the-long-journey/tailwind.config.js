/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        aurora: {
          50: '#f1fbf8',
          100: '#dff7f0',
          200: '#b9efe1',
          300: '#86e1cd',
          400: '#4ccfb5',
          500: '#21b89f',
          600: '#179583',
          700: '#15786b',
          800: '#135e56',
          900: '#104a44',
        },
        brass: '#bfa26a',
      },
      boxShadow: {
        aura: '0 0 40px rgba(18, 94, 86, 0.35)'
      }
    },
  },
  plugins: [],
};

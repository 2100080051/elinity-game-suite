/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        elinity: {
          50: '#F8F7F2',
          100: '#F3F0E6',
          200: '#E6DFC9',
          300: '#D7C79C',
          400: '#C9B170',
          500: '#B9984A',
          600: '#9E7E38',
          700: '#7C612B',
          800: '#5C4720',
          900: '#3C2F16'
        },
        dusk: '#0B0F1A',
        mist: '#A5B4CF',
        rose: '#E11D48',
        gold: '#D4AF37',
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        premium: '0 10px 30px rgba(0,0,0,0.4)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
      },
      animation: {
        shimmer: 'shimmer 3s ease-in-out infinite',
        fadeIn: 'fadeIn 400ms ease-out',
      },
    },
  },
  plugins: [],
};

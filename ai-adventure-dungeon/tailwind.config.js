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
        dungeon: "#0B1220",
        gold: "#D4AF37",
        crimson: "#B91C1C",
        mist: "#94A3B8",
      },
      fontFamily: {
        cinzel: ['"Cinzel"', 'ui-serif', 'Georgia', 'serif'],
      },
      keyframes: {
        torch: {
          '0%,100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(1.12)' },
        },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
      },
      animation: {
        torch: 'torch 1600ms ease-in-out infinite',
        fadeIn: 'fadeIn 400ms ease-out',
      },
    },
  },
  plugins: [],
};

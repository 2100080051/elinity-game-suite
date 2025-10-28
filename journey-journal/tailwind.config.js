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
        sand: "#E8DCC3",
        forest: "#2F6D4E",
        deepblue: "#0F2A44",
        gold: "#D4A017",
        parchment: "#F7F3EA",
      },
      fontFamily: {
        merri: ['"Merriweather"', 'ui-serif', 'Georgia', 'serif'],
      },
      keyframes: {
        inkFade: {
          '0%': { opacity: 0, filter: 'blur(2px)' },
          '100%': { opacity: 1, filter: 'blur(0)' },
        },
        pageTurn: {
          '0%': { transform: 'rotateX(-10deg)', opacity: 0 },
          '100%': { transform: 'rotateX(0deg)', opacity: 1 },
        },
      },
      animation: {
        ink: 'inkFade 600ms ease-out',
        page: 'pageTurn 500ms ease-out',
      },
    },
  },
  plugins: [],
};

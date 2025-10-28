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
        labslate: "#0F172A",
        labsilver: "#94A3B8",
        labindigo: "#6366F1",
        labgreen: "#22C55E",
      },
      fontFamily: {
        inter: ['"Inter"', 'ui-sans-serif', 'system-ui'],
      },
      keyframes: {
        typewriter: {
          '0%': { width: '0ch' },
          '100%': { width: '50ch' }
        },
        caret: {
          '0%,100%': { opacity: 1 },
          '50%': { opacity: 0 }
        }
      },
      animation: {
        typewriter: 'typewriter 3s steps(50) 1 normal both',
        caret: 'caret 800ms steps(1) infinite',
      },
    },
  },
  plugins: [],
};

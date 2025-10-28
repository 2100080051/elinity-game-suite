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
        purplepop: "#7C3AED",
        neonblue: "#22D3EE",
        orangefun: "#FB923C",
        darkbg: "#0B1020",
      },
      fontFamily: {
        poppins: ['"Poppins"', 'ui-sans-serif', 'system-ui'],
      },
      keyframes: {
        flipIn: {
          '0%': { transform: 'rotateX(90deg)', opacity: 0 },
          '100%': { transform: 'rotateX(0deg)', opacity: 1 },
        },
        flash: {
          '0%,100%': { opacity: 1 },
          '50%': { opacity: 0.2 },
        },
      },
      animation: {
        flipIn: 'flipIn 500ms ease-out',
        flash: 'flash 800ms ease-in-out',
      },
    },
  },
  plugins: [],
};

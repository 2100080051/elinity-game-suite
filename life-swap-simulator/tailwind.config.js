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
        warmbg: "#0E1218",
        goldsoft: "#F5D493",
        tealsoft: "#6EE7D2",
        lavender: "#C4B5FD",
      },
      fontFamily: {
        poppins: ['"Poppins"', 'ui-sans-serif', 'system-ui'],
        inter: ['"Inter"', 'ui-sans-serif', 'system-ui'],
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
      },
      animation: {
        floaty: 'floaty 4s ease-in-out infinite',
        fadeIn: 'fadeIn 400ms ease-out',
      },
    },
  },
  plugins: [],
};

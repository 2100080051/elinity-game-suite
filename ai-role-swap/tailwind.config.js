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
        electric: "#1FB6FF",
        coral: "#FF6B6B",
        lemon: "#FFD166",
        ink: "#0F172A",
        night: "#0B1020",
      },
      fontFamily: {
        poppins: ['"Poppins"', 'ui-sans-serif', 'system-ui'],
      },
      keyframes: {
        spotlight: {
          '0%': { filter: 'brightness(0.6)', transform: 'scale(0.98)' },
          '100%': { filter: 'brightness(1)', transform: 'scale(1)' },
        },
        wobble: {
          '0%,100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      animation: {
        spotlight: 'spotlight 400ms ease-out',
        wobble: 'wobble 500ms ease',
        fadeIn: 'fadeIn 500ms ease-out',
      },
    },
  },
  plugins: [],
};

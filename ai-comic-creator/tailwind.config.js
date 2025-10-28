/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        comicYellow: '#ffd400',
        comicMagenta: '#ff3da6',
        comicBlue: '#2aa4ff',
        ink: '#121212'
      },
      boxShadow: {
        pop: '6px 6px 0 #000000',
        glow: '0 0 22px rgba(255,212,0,0.35)'
      },
      backgroundImage: {
        dots: 'radial-gradient(#222 1px, transparent 1px)',
      },
      backgroundSize: {
        dots: '10px 10px',
      }
    }
  },
  plugins: [],
};

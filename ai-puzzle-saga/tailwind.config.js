/******************************
 * Tailwind config
 *****************************/
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: '#111013',
        cyanGlow: '#7be1ff',
        amberNarr: '#ffcc66',
      },
      fontFamily: {
        title: ['Cinzel', 'Cormorant Garamond', 'serif'],
        body: ['ui-serif', 'Georgia', 'serif']
      },
      boxShadow: {
        glow: '0 0 24px rgba(123,225,255,0.25)',
      },
      backgroundImage: {
        nebula: "radial-gradient(1200px 800px at 50% -200px, rgba(123,225,255,0.08), rgba(0,0,0,0)), radial-gradient(1000px 700px at 50% 120%, rgba(255,204,102,0.07), rgba(0,0,0,0))",
      }
    },
  },
  plugins: [],
};

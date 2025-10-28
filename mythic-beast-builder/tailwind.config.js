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
        parchment: '#1b1a16',
        rune: '#c8a46b',
        ember: '#ff7a33',
        shadow: '#0d0c0a',
      },
      fontFamily: {
        mystic: ['Cinzel', 'IM Fell English', 'serif'],
        body: ['ui-serif', 'Georgia', 'serif']
      },
      boxShadow: {
        glow: '0 0 20px rgba(200,164,107,0.25)',
      },
      backgroundImage: {
        parchment: "radial-gradient(1000px 600px at 50% -200px, rgba(255, 214, 150, 0.08), rgba(0,0,0,0)), radial-gradient(1200px 800px at 50% 120%, rgba(200,164,107,0.08), rgba(0,0,0,0))",
      }
    },
  },
  plugins: [],
};

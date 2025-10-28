/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ocean: '#7db9e8',
        orchid: '#b889f4',
        dawn: '#ffd38a',
        cyanGlow: '#8be6ff',
        coral: '#ff9aa2'
      },
      boxShadow: {
        glow: '0 0 30px rgba(139,230,255,0.35)'
      },
      backgroundImage: {
        moodGradient: 'linear-gradient(135deg, rgba(125,185,232,0.25), rgba(184,137,244,0.25), rgba(255,211,138,0.25))'
      },
      animation: {
        breathe: 'breathe 8s ease-in-out infinite'
      },
      keyframes: {
        breathe: {
          '0%, 100%': { filter: 'saturate(90%) brightness(95%)' },
          '50%': { filter: 'saturate(110%) brightness(102%)' }
        }
      }
    }
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        peach: '#ffc3a0',
        mint: '#a7f3d0',
        lavender: '#c4b5fd',
        softGold: '#ffdf80',
        sky: '#7dd3fc'
      },
      boxShadow: {
        glow: '0 0 30px rgba(255,223,128,0.35)'
      },
      backgroundImage: {
        skyLoop: 'linear-gradient(180deg, rgba(125,211,252,0.12), rgba(196,181,253,0.12), rgba(255,195,160,0.12))'
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        breathe: 'breathe 10s ease-in-out infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        },
        breathe: {
          '0%,100%': { filter:'saturate(95%) brightness(95%)' },
          '50%': { filter:'saturate(110%) brightness(103%)' }
        }
      }
    }
  },
  plugins: [],
};

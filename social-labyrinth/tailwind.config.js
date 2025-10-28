/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}','./components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lab: {
          night: '#0a0d1c',
          grid: '#0d1328',
          neon: '#9ae6b4',
          amber: '#f0c674',
          steel: '#cbd5e1'
        }
      },
      backgroundImage: {
        grid: 'linear-gradient(0deg, rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)'
      },
      backgroundSize: {
        grid: '28px 28px'
      },
      boxShadow: {
        pane: '0 0 0 1px rgba(203,213,225,.15), 0 12px 40px rgba(154,230,180,.18)'
      },
      keyframes: {
        pulse: { '0%':{ opacity:.6 }, '50%':{ opacity:1 }, '100%':{ opacity:.6 } },
        floaty: { '0%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-4px)' }, '100%':{ transform:'translateY(0)' } },
        door: { '0%':{ transform:'scaleX(.96)', opacity:.0 }, '100%':{ transform:'scaleX(1)', opacity:1 } }
      },
      animation: {
        pulse: 'pulse 2.6s ease-in-out infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        door: 'door .25s ease-out both'
      }
    }
  },
  plugins: [],
};

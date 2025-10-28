/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}','./components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        arena: {
          bg: '#0a0b14',
          violet: '#7c3aed',
          cyan: '#06b6d4',
          magenta: '#ec4899',
          neon: '#22d3ee'
        }
      },
      fontFamily: {
        display: ['Poppins', 'ui-sans-serif', 'system-ui']
      },
      backgroundImage: {
        arenaGrid: 'radial-gradient(1px 1px at 8px 8px, rgba(255,255,255,.07) 1px, transparent 1px)',
        arenaGlow: 'linear-gradient(180deg, rgba(10,11,20,1) 0%, rgba(12,10,28,1) 50%, rgba(16,10,32,1) 100%)'
      },
      keyframes: {
        pulseSoft: { '0%':{ opacity:.7 }, '50%':{ opacity:1 }, '100%':{ opacity:.7 } },
        scan: { '0%':{ transform:'translateX(-100%)' }, '100%':{ transform:'translateX(100%)' } },
        confetti: { '0%':{ transform:'translateY(-10px) rotate(0)' }, '100%':{ transform:'translateY(60px) rotate(160deg)' } }
      },
      animation: {
        pulseSoft: 'pulseSoft 2.4s ease-in-out infinite',
        scan: 'scan 3s linear infinite',
        confetti: 'confetti 1.2s ease-out forwards'
      },
      boxShadow: {
        neon: '0 0 0 1px rgba(34,211,238,.4), 0 0 24px rgba(124,58,237,.25)',
      }
    }
  },
  plugins: [],
};

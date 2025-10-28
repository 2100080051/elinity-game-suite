/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Neon arcade puzzle palette
        base: {
          900: '#0b0d14',
          800: '#0f1220',
          700: '#14182b'
        },
        neon: {
          cyan: '#22d3ee',
          magenta: '#e879f9',
          lime: '#a3e635',
          amber: '#f59e0b'
        },
        puzzle: {
          50: '#0b0d14',
          100: '#0f1220',
          200: '#14182b',
          400: '#1b2040',
          500: '#1f2757',
          600: '#23306e'
        }
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.25)',
        glow: '0 0 0 1px rgba(34,211,238,0.55), 0 10px 30px rgba(232,121,249,0.25)'
      },
      dropShadow: {
        neon: '0 0 12px rgba(34,211,238,0.7)'
      },
      backgroundImage: {
        'grid': 'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
        'arcade': 'radial-gradient(1200px 600px at 10% 10%, rgba(232,121,249,0.18), transparent 60%), radial-gradient(900px 600px at 90% 20%, rgba(34,211,238,0.18), transparent 60%), radial-gradient(1000px 800px at 50% 100%, rgba(163,230,53,0.12), transparent 50%)'
      },
      keyframes: {
        fadeInUp: { '0%':{opacity:0, transform:'translateY(8px)'}, '100%':{opacity:1, transform:'translateY(0)'} },
        pulseSoft: { '0%,100%':{opacity:1}, '50%':{opacity:.85} },
        glow: { '0%,100%':{ boxShadow: '0 0 0 1px rgba(34,211,238,0.55), 0 0 20px rgba(232,121,249,0.3)' }, '50%':{ boxShadow: '0 0 0 1px rgba(232,121,249,0.55), 0 0 24px rgba(34,211,238,0.35)' } },
        gradient: { '0%,100%':{ backgroundPosition: '0% 50%' }, '50%':{ backgroundPosition: '100% 50%' } }
      },
      animation: {
        fadeInUp: 'fadeInUp .45s ease-out both',
        pulseSoft: 'pulseSoft 3s ease-in-out infinite',
        glow: 'glow 3s ease-in-out infinite',
        gradient: 'gradient 14s ease infinite'
      }
    }
  },
  plugins: [],
};

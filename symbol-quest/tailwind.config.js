/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}','./components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        myst: {
          night: '#0d0a1a',
          deep: '#1a1333',
          purple: '#6b4fa3',
          silver: '#cbd5e1',
          gold: '#f0c674'
        }
      },
      boxShadow: {
        rune: '0 0 0 1px rgba(203,213,225,.25), 0 8px 30px rgba(107,79,163,.35)'
      },
      backgroundImage: {
        veil: 'radial-gradient(1000px 700px at 20% -10%, rgba(107,79,163,.18), transparent 60%), radial-gradient(900px 600px at 80% 0%, rgba(240,198,116,.14), transparent 60%), linear-gradient(180deg, #0d0a1a 0%, #1a1333 70%, #120e22 100%)'
      },
      keyframes: {
        floaty: { '0%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' }, '100%': { transform: 'translateY(0px)' } },
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        motes: { '0%': { transform: 'translateY(0)' }, '100%': { transform: 'translateY(-40px)' } },
        ripple: { '0%': { opacity: .25, transform: 'scale(.95)' }, '100%': { opacity: 0, transform: 'scale(1.2)' } }
      },
      animation: {
        floaty: 'floaty 4s ease-in-out infinite',
        fadeIn: 'fadeIn .4s ease-out both',
        motes: 'motes 5s linear infinite',
        ripple: 'ripple .9s ease-out'
      }
    }
  },
  plugins: [],
};

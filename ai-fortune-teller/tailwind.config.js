/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}','./components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        oracle: {
          indigo: '#0b1026',
          midnight: '#0a0e22',
          gold: '#f0c674',
          teal: '#2dd4bf'
        }
      },
      backgroundImage: {
        starfield: 'radial-gradient(1000px 700px at 20% -10%, rgba(45,212,191,.12), transparent 60%), radial-gradient(900px 600px at 80% 0%, rgba(240,198,116,.14), transparent 60%), linear-gradient(180deg, #0b1026 0%, #0a0e22 70%, #0a0d1c 100%)'
      },
      boxShadow: {
        crystal: '0 0 0 1px rgba(240,198,116,.25), 0 12px 40px rgba(45,212,191,.25)'
      },
      keyframes: {
        orb: { '0%':{ boxShadow:'0 0 20px rgba(45,212,191,.25)' }, '50%':{ boxShadow:'0 0 36px rgba(240,198,116,.35)' }, '100%':{ boxShadow:'0 0 20px rgba(45,212,191,.25)' } },
        shimmer: { '0%':{ opacity:.6 }, '50%':{ opacity:1 }, '100%':{ opacity:.6 } },
        unroll: { '0%':{ transform:'scaleY(0.95)', opacity:0 }, '100%':{ transform:'scaleY(1)', opacity:1 } }
      },
      animation: {
        orb: 'orb 3.5s ease-in-out infinite',
        shimmer: 'shimmer 2.4s ease-in-out infinite',
        unroll: 'unroll .5s ease-out both'
      }
    }
  },
  plugins: [],
};

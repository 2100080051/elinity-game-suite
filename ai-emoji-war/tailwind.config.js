/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}','./components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        arena: { night:'#0a0f24', neon:'#ff4ecd', sun:'#ffd147', cyan:'#4de0ff' }
      },
      boxShadow: { neon: '0 0 0 1px rgba(255,78,205,.3), 0 15px 50px rgba(77,224,255,.25)' },
      keyframes: {
        rain: { '0%':{ transform:'translateY(-10%)' }, '100%':{ transform:'translateY(110%)' } },
        pulsefast: { '0%':{ opacity:.6 }, '50%':{ opacity:1 }, '100%':{ opacity:.6 } }
      },
      animation: { rain:'rain 12s linear infinite', pulsefast:'pulsefast 2s ease-in-out infinite' }
    }
  },
  plugins: [],
};
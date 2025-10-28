/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}','./components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        arena: { night:'#0a0b1e', neon:'#ff4ecd', cyan:'#55e6ff', gold:'#ffd147', lime:'#a6ff4d' }
      },
      boxShadow: { neon:'0 0 0 1px rgba(85,230,255,.25), 0 22px 70px rgba(255,78,205,.25)' },
      keyframes: {
        pulseBeat: { '0%':{transform:'scale(1)'}, '50%':{transform:'scale(1.03)'}, '100%':{transform:'scale(1)'} },
        bars: { '0%':{height:'10%'}, '50%':{height:'85%'}, '100%':{height:'10%'} }
      },
      animation: { pulseBeat:'pulseBeat 1s ease-in-out infinite', bars:'bars 1.2s ease-in-out infinite' }
    }
  },
  plugins: [],
};

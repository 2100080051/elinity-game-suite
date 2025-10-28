/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}','./components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cotton: { 50:'#fdf4ff',100:'#fae8ff',200:'#f5d0fe' },
        sky: { 50:'#ecfeff',100:'#cffafe',200:'#a5f3fc' },
        blush: { 50:'#fff1f2',100:'#ffe4e6',200:'#fecdd3' },
        mint: { 100:'#d1fae5',200:'#a7f3d0' },
        lilac: { 100:'#ede9fe',200:'#ddd6fe' },
        ink: { 900:'#0f172a', 800:'#111827' }
      },
      backgroundImage: {
        softField: 'radial-gradient(1000px 600px at 50% -10%, rgba(165,243,252,.18), transparent 60%), radial-gradient(800px 500px at 80% 10%, rgba(255,205,211,.15), transparent 60%)',
        dotGrid: 'radial-gradient(1px 1px at 8px 8px, rgba(255,255,255,.15) 1px, transparent 1px)'
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,.24)',
        glow: '0 0 0 1px rgba(255,255,255,.15), 0 8px 24px rgba(165,243,252,.25)'
      },
      keyframes: {
        fadeUp: { '0%':{ opacity:0, transform:'translateY(8px)' }, '100%':{ opacity:1, transform:'translateY(0)'} },
        floaty: { '0%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-4px)' }, '100%':{ transform:'translateY(0)' } },
        pulseSoft: { '0%,100%':{ opacity:.6 }, '50%':{ opacity:1 } },
        slideIn: { '0%':{ opacity:0, transform:'translateY(10px) scale(.98)' }, '100%':{ opacity:1, transform:'translateY(0) scale(1)' } },
        pop: { '0%':{ transform:'scale(.92)' }, '100%':{ transform:'scale(1)' } },
        ripple: { '0%':{ transform:'scale(0)', opacity:.4 }, '100%':{ transform:'scale(1)', opacity:0 } }
      },
      animation: {
        fadeUp: 'fadeUp .35s ease-out both',
        floaty: 'floaty 4s ease-in-out infinite',
        pulseSoft: 'pulseSoft 2.8s ease-in-out infinite',
        slideIn: 'slideIn .38s ease-out both',
        pop: 'pop .18s ease-out both',
        ripple: 'ripple .6s ease-out'
      }
    }
  },
  plugins: [],
};

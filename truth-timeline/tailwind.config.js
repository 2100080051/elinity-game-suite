/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}','./components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tt: { night:'#0b0f1a', deep:'#1a1033', gold:'#ffd79a', cyan:'#72e7ff', violet:'#b499ff' }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(114,231,255,.25), 0 20px 60px rgba(180,153,255,.25)'
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      keyframes: {
        fadein: { '0%':{opacity:0, transform:'translateY(4px)'}, '100%':{opacity:1, transform:'translateY(0)'} },
        pulseSoft: { '0%':{opacity:.7}, '50%':{opacity:1}, '100%':{opacity:.7} }
      },
      animation: {
        fadein: 'fadein .5s ease-out both',
        pulseSoft: 'pulseSoft 3s ease-in-out infinite'
      }
    }
  },
  plugins: [],
};

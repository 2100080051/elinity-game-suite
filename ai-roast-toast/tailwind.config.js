/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}','./components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        club: {
          night: '#0b0820',
          neon: '#ff9d47',
          gold: '#f5d27a',
          plum: '#6a4caf'
        }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,157,71,.25), 0 10px 40px rgba(255,157,71,.25)'
      },
      keyframes: {
        flame: { '0%':{ transform:'translateY(0)', opacity:.9 }, '50%':{ transform:'translateY(-4px)', opacity:1 }, '100%':{ transform:'translateY(0)', opacity:.9 } },
        heart: { '0%':{ transform:'scale(1)', filter:'brightness(1)' }, '50%':{ transform:'scale(1.04)', filter:'brightness(1.15)' }, '100%':{ transform:'scale(1)' } }
      },
      animation: {
        flame: 'flame 2.4s ease-in-out infinite',
        heart: 'heart 2.6s ease-in-out infinite'
      }
    }
  },
  plugins: [],
};

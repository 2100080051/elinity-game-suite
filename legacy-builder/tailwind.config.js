/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}','./components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        codex: {
          night: '#0b0a10',
          parchment: '#f1e9d2',
          gold: '#d4af37',
          jade: '#6dbb9b',
          silver: '#c9d1d9'
        }
      },
      boxShadow: {
        scroll: 'inset 0 0 0 1px rgba(212,175,55,.25), 0 10px 40px rgba(109,187,155,.18)'
      },
      keyframes: {
        stars: { '0%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-8px)' }, '100%':{ transform:'translateY(0)' } },
        twinkle: { '0%':{ opacity:.6 }, '50%':{ opacity:1 }, '100%':{ opacity:.6 } }
      },
      animation: {
        stars: 'stars 12s ease-in-out infinite',
        twinkle: 'twinkle 3.5s ease-in-out infinite'
      }
    }
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}','./components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        meadow: { 900:'#0b0f0b', 800:'#101510', 700:'#151c14', 600:'#1d261c' },
        leaf: { 300:'#86efac', 400:'#4ade80', 500:'#22c55e' },
        blossom: { 300:'#f9a8d4', 400:'#f472b6', 500:'#ec4899' },
        soil: { 500:'#6b4f3a', 600:'#5a412f' }
      },
      backgroundImage: {
        pixelGarden: 'linear-gradient(0deg, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px), radial-gradient(800px 500px at 50% 0%, rgba(134,239,172,0.10), transparent 60%)'
      },
      backgroundSize: {
        pixel: '16px 16px'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.25)',
        bloom: '0 0 0 1px rgba(244,114,182,0.35), 0 10px 24px rgba(244,114,182,0.18)'
      },
      keyframes: {
        sprout: { '0%':{ transform:'scaleY(0.6)', opacity:'0' }, '100%':{ transform:'scaleY(1)', opacity:'1' } },
        bloom: { '0%':{ transform:'scale(0.9)', filter:'saturate(0.7)' }, '100%':{ transform:'scale(1)', filter:'saturate(1)' } }
      },
      animation: {
        sprout: 'sprout .35s ease-out both',
        bloom: 'bloom .45s ease-out both'
      }
    }
  },
  plugins: [],
};

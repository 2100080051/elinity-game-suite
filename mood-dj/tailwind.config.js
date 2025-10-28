/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        studio: { 900:'#0a0b12', 800:'#0f111a', 700:'#161825', 600:'#1e2133' },
        prism: { 400:'#8b5cf6', 500:'#ec4899', 600:'#22d3ee', 700:'#f59e0b' },
        glass: { 100:'rgba(255,255,255,0.06)', 200:'rgba(255,255,255,0.10)' }
      },
      backgroundImage: {
        prismGlow: 'radial-gradient(600px 400px at 10% 0%, rgba(139,92,246,0.20), transparent 65%), radial-gradient(700px 500px at 90% 0%, rgba(236,72,153,0.18), transparent 60%), radial-gradient(800px 600px at 50% 100%, rgba(34,211,238,0.14), transparent 60%)',
        scanlines: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 10px 30px rgba(0,0,0,0.35)',
        neon: '0 0 0 1px rgba(139,92,246,0.45), 0 10px 24px rgba(236,72,153,0.25)'
      },
      keyframes: {
        beat: { '0%,100%':{ transform: 'scale(1)' }, '50%':{ transform: 'scale(1.08)' } },
        eq: {
          '0%':{ transform:'scaleY(0.2)' },
          '30%':{ transform:'scaleY(1)' },
          '60%':{ transform:'scaleY(0.4)' },
          '100%':{ transform:'scaleY(0.7)' }
        }
      },
      animation: {
        beat: 'beat 0.8s ease-in-out infinite',
        eq: 'eq 1.2s ease-in-out infinite'
      }
    }
  },
  plugins: [],
};

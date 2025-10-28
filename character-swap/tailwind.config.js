/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Theater/velvet stage palette (distinct from other apps)
        stage: {
          900: '#140a1a', // deep aubergine
          800: '#1a0f22',
          700: '#22132c',
          600: '#2c1838'
        },
        velvet: {
          500: '#8a1538', // velvet red
          400: '#b41d44'
        },
        gold: {
          400: '#f2c35b',
          500: '#f0b32f'
        },
        teal: { 400: '#2dd4bf' }
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.25)',
        marquee: '0 0 0 1px rgba(242,195,91,0.45), 0 10px 24px rgba(242,195,91,0.15)'
      },
      backgroundImage: {
        'curtains': 'repeating-linear-gradient(90deg, rgba(138,21,56,0.35) 0, rgba(138,21,56,0.35) 4px, rgba(138,21,56,0.15) 4px, rgba(138,21,56,0.15) 12px)',
        'stage-gradient': 'radial-gradient(1200px 800px at 50% 100%, rgba(240,179,47,0.06), transparent 60%), radial-gradient(800px 600px at 0% 0%, rgba(138,21,56,0.06), transparent 60%), radial-gradient(800px 600px at 100% 0%, rgba(45,212,191,0.05), transparent 60%)',
        'stage-vignette': 'radial-gradient(120% 120% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.4) 100%)',
        'velvet-texture': 'radial-gradient(1px 2px at 10% 20%, rgba(255,255,255,0.03) 0, transparent 60%), radial-gradient(2px 1px at 70% 60%, rgba(0,0,0,0.15) 0, transparent 60%)'
      },
      keyframes: {
        fadeInUp: { '0%':{opacity:0, transform:'translateY(10px)'}, '100%':{opacity:1, transform:'translateY(0)'} },
        marqueeBlink: { '0%,100%':{ opacity: 1 }, '50%':{ opacity: .6 } }
      },
      animation: {
        fadeInUp: 'fadeInUp .45s ease-out both',
        marqueeBlink: 'marqueeBlink 1.6s ease-in-out infinite'
      }
    }
  },
  plugins: [],
};

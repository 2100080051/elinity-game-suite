/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        noir: { 900: '#0b0f14', 800: '#111822', 700: '#151e2a', 600: '#1b2736' },
        paper: { 50: '#FEFAF1', 100: '#F6EBD7', 200: '#EBD9BA' },
        brass: { 300: '#F3D89A', 400: '#EBCB78', 500: '#E2B857' },
        accent: { 400: '#5ED0BD', 500: '#33C3AA' },
        ink: { 800: '#0f172a', 900: '#0b1220' }
      },
      boxShadow: {
        pin: '0 8px 18px rgba(0,0,0,0.3)',
        note: '0 14px 28px rgba(0,0,0,0.3)',
        brass: '0 0 0 1px rgba(226,184,87,0.35), 0 10px 28px rgba(226,184,87,0.18)'
      },
      backgroundImage: {
        desk: 'radial-gradient(1200px 800px at 50% 0%, rgba(94,208,189,0.06), transparent 60%), radial-gradient(1000px 700px at 50% 100%, rgba(226,184,87,0.08), transparent 60%), linear-gradient(180deg, #111822, #0b0f14)',
        grain: 'radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.04) 0, transparent 60%), radial-gradient(1px 1px at 70% 80%, rgba(0,0,0,0.15) 0, transparent 60%)'
      },
      keyframes: {
        bob: { '0%,100%': { transform: 'translateY(0) rotate(-0.2deg)'}, '50%': { transform: 'translateY(-4px) rotate(0.2deg)'} },
        slideUp: { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        timerRoll: { '0%': { width: '100%' }, '100%': { width: '0%' } }
      },
      animation: {
        bob: 'bob 6s ease-in-out infinite',
        slideUp: 'slideUp .25s ease-out both',
        timerRoll: 'timerRoll 20s linear forwards'
      }
    },
  },
  plugins: [],
}

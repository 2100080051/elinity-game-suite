/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { board: { 50:'#f8fafc', 200:'#e2e8f0', 500:'#64748b', 700:'#334155', 900:'#0f172a' }, accent: '#22c55e' },
      boxShadow: { glow: '0 0 40px rgba(34,197,94,0.25)' }
    }
  },
  plugins: [],
};

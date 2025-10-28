/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        aurora1: '#A78BFA',
        aurora2: '#FBCFE8',
        aurora3: '#6EE7B7',
      }
    },
  },
  plugins: [],
}

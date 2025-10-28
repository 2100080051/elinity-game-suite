/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // New premium Elinity palette
        elinity: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        indigo: {
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          gold: '#f6c453',
          amber: '#f59e0b',
        },
        surface: {
          50: '#0b0b12',
          100: '#0f0f17',
          200: '#131321',
          300: '#17172a',
          400: '#1c1c33',
        },
        paper: { 50:'#faf8f5', 100:'#f4efe8', 200:'#e8e1d6', 400:'#d6c7b1', 700:'#6b5d4a' },
        ink: '#1f2937',
        sky: '#bae6fd',
        gold: '#fde68a'
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.15)',
        glow: '0 0 0 1px rgba(167,139,250,0.5), 0 10px 30px rgba(99,102,241,0.25)',
      },
      dropShadow: {
        glow: '0 0 10px rgba(167,139,250,0.6)',
      },
      backgroundImage: {
        'elinity-gradient': 'radial-gradient(1200px 600px at 10% 10%, rgba(99,102,241,0.25), transparent 60%), radial-gradient(900px 600px at 90% 20%, rgba(139,92,246,0.2), transparent 60%), radial-gradient(1000px 800px at 50% 100%, rgba(245,158,11,0.15), transparent 50%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientBG: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        fadeInUp: 'fadeInUp .5s ease-out both',
        shimmer: 'shimmer 2.5s linear infinite',
        gradientBG: 'gradientBG 12s ease infinite',
      },
    }
  },
  plugins: [],
};
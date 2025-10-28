/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./pages/**/*.{js,jsx,ts,tsx}','./components/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {
			colors: {
				ink: { 900:'#0b1220', 800:'#0f172a' },
				aurora: { 100:'#c7d2fe', 200:'#a5b4fc' },
				dusk: { 100:'#bae6fd', 200:'#7dd3fc' },
				sand: { 200:'#fef3c7', 300:'#fde68a' }
			},
			backgroundImage: {
				auroraField: 'radial-gradient(1100px 700px at 50% -10%, rgba(165,180,252,.18), transparent 60%), radial-gradient(900px 600px at 80% 10%, rgba(125,211,252,.15), transparent 60%)',
				dotGrid: 'radial-gradient(1px 1px at 8px 8px, rgba(255,255,255,.14) 1px, transparent 1px)'
			},
			boxShadow: {
				card: '0 10px 30px rgba(0,0,0,.24)',
				glow: '0 0 0 1px rgba(255,255,255,.12), 0 8px 24px rgba(125,211,252,.25)'
			},
			keyframes: {
				fadeUp: { '0%':{ opacity:0, transform:'translateY(8px)' }, '100%':{ opacity:1, transform:'translateY(0)'} },
				floaty: { '0%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-4px)' }, '100%':{ transform:'translateY(0)' } },
				wave: { '0%':{ transform:'translateX(0)' }, '100%':{ transform:'translateX(-50%)' } },
				shimmer: { '0%':{ opacity:.4 }, '50%':{ opacity:1 }, '100%':{ opacity:.4 } }
			},
			animation: {
				fadeUp: 'fadeUp .35s ease-out both',
				floaty: 'floaty 6s ease-in-out infinite',
				wave: 'wave 12s linear infinite',
				shimmer: 'shimmer 2.4s ease-in-out infinite'
			}
		}
	},
	plugins: [],
};

import '../styles/globals.css'
import Head from 'next/head'
import { useEffect, useState } from 'react'

export default function MyApp({ Component, pageProps }) {
  const [classic, setClassic] = useState(false)
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    if (saved === 'classic') setClassic(true)
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', classic ? 'classic' : 'modern')
    }
  }, [classic])
  return (
    <div className={`min-h-screen ${classic ? 'theme-classic' : ''}`}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          body { font-family: Manrope, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
          .section-title{ font-family: "Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
          .theme-classic .section-title{ font-family: "Cormorant Garamond", ui-serif, Georgia, Cambria, Times, serif; }
          .theme-classic body { font-family: Manrope, ui-sans-serif, system-ui; }
        `}</style>
        <title>Life Swap Simulator</title>
      </Head>
      {!classic && (<>
        <div className="aurora" />
        <div className="grid-overlay" />
      </>)}
      {classic && (<div className="paper-background" />)}
      <header className="container py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`elinity-badge elinity-badge--xl ${!classic ? 'elinity-badge--glow' : ''}`}>
            <span className="elinity-dot"/>
            ELINITY
          </div>
          <span className="brand-subtitle">Life Swap Simulator</span>
        </div>
        <div className="hidden sm:flex gap-2 opacity-70 relative h-8 w-24">
          <div className="sparkle" style={{ top: 8, left: 12 }} />
          <div className="sparkle" style={{ top: 18, left: 32 }} />
          <div className="sparkle" style={{ top: 10, left: 56 }} />
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline" onClick={() => setClassic(v => !v)}>
            {classic ? 'Modern' : 'Classic'}
          </button>
        </div>
      </header>
      <main className="container pb-10">
        <Component {...pageProps} />
      </main>
      <footer className="container py-8 text-xs text-slate-500">
        <div className="glass p-4 flex items-center justify-between">
          <div>Made with OpenRouter • JSON-safe</div>
          <div className="hidden sm:block">Tip: Press <kbd className="kbd">Enter</kbd> to submit</div>
        </div>
      </footer>
    </div>
  )
}

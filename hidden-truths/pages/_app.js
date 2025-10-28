import '../styles/globals.css'
import { useEffect } from 'react'

export default function App({ Component, pageProps }){
  // Lightweight click sound for buttons (no audio assets required)
  useEffect(() => {
    let ctx
    const playClick = () => {
      try{
        if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'triangle'; o.frequency.value = 520
        g.gain.value = 0.04
        o.connect(g); g.connect(ctx.destination)
        o.start(); setTimeout(()=> { o.stop() }, 60)
      }catch{}
    }
    const onDown = (e) => {
      const el = e.target.closest('button, [role="button"]')
      if(el) playClick()
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])
  return (
    <div className="min-h-full relative">
      <div className="sparkles" />
      <header className="sticky top-0 z-10 bg-gradient-to-b from-black/30 to-transparent backdrop-blur-sm border-b border-white/10">
        <div className="container py-3 flex items-center justify-between">
          <div className="elinity-badge elinity-badge--glow">
            <span className="elinity-dot" />
            ELINITY
          </div>
          <div className="text-xs text-white/70">Hidden Truths</div>
        </div>
      </header>
      <main className="container py-6 relative z-10">
        <Component {...pageProps} />
      </main>
      <footer className="container pb-8 text-center text-xs text-white/60">
        Crafted with empathy • Share gently
      </footer>
    </div>
  )
}

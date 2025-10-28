import '../styles/globals.css'
import { useEffect, useRef, useState } from 'react'

export default function App({ Component, pageProps }){
  const tensionRef = useRef(null)
  const heartRef = useRef(null)
  const [soundOn, setSoundOn] = useState(true)

  useEffect(() => {
    const t = tensionRef.current
    const h = heartRef.current
    if(!t || !h) return
    t.volume = 0.25; t.loop = true
    h.volume = 0.2
  }, [])

  // basic click SFX using Web Audio for buttons
  useEffect(() => {
    let ctx
    const playClick = () => {
      if(!soundOn) return
      try{
        if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'triangle'; o.frequency.value = 480
        g.gain.value = 0.045
        o.connect(g); g.connect(ctx.destination)
        o.start(); setTimeout(()=> { o.stop() }, 50)
      }catch{}
    }
    const onDown = (e) => {
      const el = e.target.closest('button, [role="button"]')
      if(el) playClick()
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [soundOn])

  return (
    <div className="min-h-full relative">
      <header className="sticky top-0 z-10 bg-gradient-to-b from-black/30 to-transparent backdrop-blur-sm border-b border-white/10">
        <div className="container py-3 flex items-center justify-between">
          <div className="badge">
            <span className="dot" />
            ELINITY
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-ghost text-xs" onClick={()=> setSoundOn(s=>!s)}>{soundOn ? '🔊 Sound' : '🔈 Muted'}</button>
            <div className="text-xs text-white/70">The AI Heist</div>
          </div>
        </div>
      </header>
      {/* global audio elements - control playback in pages */}
      <audio ref={tensionRef} src="/audio/tension.mp3" preload="auto" />
      <audio ref={heartRef} src="/audio/heartbeat.mp3" preload="auto" />
      <main className="container py-6 relative z-10">
        <Component {...pageProps} sound={{ soundOn, tensionRef, heartRef, setSoundOn }} />
      </main>
      <footer className="container pb-8 text-center text-xs text-white/60">
        Plan • Execute • Escape
      </footer>
    </div>
  )
}

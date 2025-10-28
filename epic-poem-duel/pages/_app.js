import '../styles/globals.css'

export default function App({ Component, pageProps }){
  return (
    <div className="min-h-full relative">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[rgba(2,6,23,0.5)] backdrop-blur-xl">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-ink font-display">
            <span>🪶</span>
            <span className="tracking-wide">Epic Poem Duel</span>
          </div>
          <div className="text-xs text-white/70">Compose • Weave • Crown</div>
        </div>
      </header>
      <main className="container py-6 relative z-10">
        <Component {...pageProps} />
      </main>
      <footer className="container pb-8 text-center text-xs text-white/60">
        Celebrate every line • Write again
      </footer>
    </div>
  )
}

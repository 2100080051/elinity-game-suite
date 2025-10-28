import '../styles/globals.css';

export default function App({ Component, pageProps }){
  return (
    <div className="min-h-screen relative text-white" style={{background:'#0b0a10'}}>
      <div className="constellation" aria-hidden />
      <header className="sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-codex-gold/60 to-codex-jade/60 shadow-md animate-twinkle" />
          <div>
            <div className="text-2xl font-cinzel">Legacy Builder</div>
            <div className="text-xs uppercase tracking-wider text-white/70">Elinity AI — Storykeeper</div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

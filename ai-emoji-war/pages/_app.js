import '../styles/globals.css';

export default function App({ Component, pageProps }){
  return (
    <div className="min-h-screen relative">
      <div className="arena" aria-hidden />
      <header className="sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-arena-neon to-arena-cyan shadow-neon animate-pulsefast" />
          <div>
            <div className="text-2xl font-semibold"><span className="text-white">E</span>linity</div>
            <div className="text-xs uppercase tracking-wider text-white/70">Elinity AI — Emoji War</div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

import '../styles/globals.css';

export default function App({ Component, pageProps }){
  return (
    <div className="min-h-screen">
      <header className="header sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-arena-neon to-arena-cyan shadow-neon animate-pulseBeat" />
            <div>
              <div className="text-2xl font-semibold">🎧 Elinity Rap Arena</div>
              <div className="text-xs uppercase tracking-wider text-white/70">AI Hype DJ • Freestyle Coach • Judge</div>
            </div>
          </div>
          <div className="text-white/70 text-sm">Powered by ElinityAI</div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

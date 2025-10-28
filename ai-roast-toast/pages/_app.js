import '../styles/globals.css';

export default function App({ Component, pageProps }){
  return (
    <div className="min-h-screen bg-[#0b0820] text-white relative">
      <header className="sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-club-neon to-club-gold shadow-glow animate-flame" />
            <div>
              <div className="text-2xl font-semibold tracking-wide"><span className="text-white">E</span>linity</div>
              <div className="text-xs uppercase tracking-wider text-white/70">Elinity AI</div>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

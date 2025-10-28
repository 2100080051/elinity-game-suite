import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <div className="min-h-screen relative">
  <div className="app-bg" />
  <div className="aurora" />
  <div className="sigils" />
      <div className="motes" />
      <header className="sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-myst-purple to-myst-gold shadow-rune animate-floaty" />
            <div>
              <div className="brand text-2xl font-semibold tracking-wide"><span className="text-white">E</span>linity</div>
              <div className="text-xs uppercase tracking-wider text-white/70">Elinity AI</div>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

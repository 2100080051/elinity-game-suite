import '../styles/globals.css';

function Badge() {
  return (
    <div className="brand-badge">
      <span className="font-semibold">Elinity</span>
      <span className="opacity-70">AI</span>
    </div>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge />
            <span className="text-lg opacity-70">by Elinity</span>
          </div>
          <nav className="flex items-center gap-6 opacity-90">
            <a href="/" className="hover:opacity-100">Home</a>
            <a href="/duel" className="hover:opacity-100">Start Duel</a>
            <a href="/leaderboard" className="hover:opacity-100">Leaderboard</a>
            <a href="/how" className="hover:opacity-100">How to Play</a>
          </nav>
        </div>
      </header>
      <main>
        <Component {...pageProps} />
      </main>
    </div>
  );
}

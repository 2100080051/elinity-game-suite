import '../styles/globals.css';

export default function MyApp({ Component, pageProps }) {
  return (
    <div className="min-h-screen relative">
      <header className="fixed top-0 left-0 right-0 z-40">
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="flex items-center justify-between">
            <a className="elinity-badge" href="#" aria-label="ELINITY">
              <span className="elinity-glow" />
              <span className="elinity-text">ELINITY</span>
            </a>
            <nav className="hidden md:flex gap-2">
              <a href="/" className="chip">Home</a>
              <a href="/session" className="chip">Begin Session</a>
              <a href="/group" className="chip">Group Play</a>
              <a href="/museum" className="chip">Future Museum</a>
            </nav>
          </div>
        </div>
      </header>
      <Component {...pageProps} />
    </div>
  );
}

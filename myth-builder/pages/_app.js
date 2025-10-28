import '../styles/globals.css';

export default function MyApp({ Component, pageProps }) {
  return (
    <div className="min-h-screen relative">
      <header className="fixed top-0 left-0 right-0 z-40">
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="banner px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="frame px-3 py-1 rounded-lg bg-white/70">
                <span className="font-serif font-bold text-ink">Myth Builder</span>
              </div>
              <nav className="hidden md:flex gap-2">
                <a href="/" className="tab">Home</a>
                <a href="/play" className="tab">Begin Myth</a>
                <a href="/book" className="tab">Book of Legends</a>
              </nav>
            </div>
            <a className="elinity-badge" href="#" aria-label="ELINITY">
              <span className="elinity-glow" />
              <span className="elinity-text">ELINITY</span>
            </a>
          </div>
        </div>
      </header>
      <Component {...pageProps} />
    </div>
  );
}

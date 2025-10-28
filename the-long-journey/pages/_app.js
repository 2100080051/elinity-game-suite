import '../styles/globals.css';

function Brand() {
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
            <Brand />
            <span className="text-lg opacity-70">by Elinity</span>
          </div>
          <nav className="flex items-center gap-6 opacity-90">
            <a href="/" className="hover:opacity-100">Home</a>
            <a href="/play" className="hover:opacity-100">Start Chapter</a>
            <a href="/timeline" className="hover:opacity-100">Timeline</a>
          </nav>
        </div>
      </header>
      <main>
        <Component {...pageProps} />
      </main>
    </div>
  );
}

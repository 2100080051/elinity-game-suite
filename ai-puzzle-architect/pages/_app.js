import '../styles/globals.css';

function Brand(){
  return <div className="brand">Elinity <span className="text-neon-cyan">Puzzle Architect</span></div>;
}

export default function App({ Component, pageProps }){
  return (
    <div className="min-h-full relative">
      <div className="app-bg" />
      <div className="app-grid" />

      <div className="header">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brand />
          </div>
          <nav className="flex items-center gap-6 text-white/85">
            <a href="/" className="hover:text-white">Home</a>
            <a href="/play" className="hover:text-white">Play</a>
          </nav>
        </div>
      </div>
      <main className="container py-7">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

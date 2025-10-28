import '../styles/globals.css';

function Brand(){
  return <div className="brand"><span className="font-semibold">Elinity</span><span className="opacity-80"> Character Swap</span></div>;
}

export default function App({ Component, pageProps }){
  return (
    <div className="min-h-full relative">
      <div className="app-bg" />
      {/* Static background only, no animated overlays */}
      <div className="header">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 marquee">
            <span className="animate-marqueeBlink">●</span>
            <Brand />
            <span className="animate-marqueeBlink" style={{animationDelay:'0.8s'}}>●</span>
          </div>
          <nav className="flex items-center gap-6 opacity-90">
            <a href="/" className="hover:opacity-100">Home</a>
            <a href="/play" className="hover:opacity-100">Play</a>
          </nav>
        </div>
      </div>
      <main className="container py-7">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

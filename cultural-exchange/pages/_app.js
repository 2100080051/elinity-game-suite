import '../styles/globals.css';

function Brand(){
  return (
    <div className="brand">
      <span className="font-semibold brand-gradient">Elinity</span>
      <span className="opacity-80">AI</span>
    </div>
  );
}

export default function App({ Component, pageProps }){
  return (
    <div className="min-h-full relative">
      <div className="app-bg" />
      <div className="app-noise" />

      <div className="header-bar">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brand />
            <span className="text-base subtle">Cultural Exchange</span>
          </div>
          <nav className="flex items-center gap-6 subtle">
            <a href="/" className="hover:text-white">Home</a>
            <a href="/play" className="hover:text-white">Play</a>
          </nav>
        </div>
      </div>

      <main className="container py-8">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

import '../styles/globals.css';

function Brand(){
  return <div className="brand"><span className="opacity-80">Elinity</span><span className="opacity-80"> • Hidden Question</span></div>;
}

export default function App({ Component, pageProps }){
  return (
    <div className="min-h-full relative">
      <div className="app-bg" />
      <header className="header">
        <div className="container py-3 flex items-center justify-between">
          <Brand />
          <nav className="flex items-center gap-6 opacity-90">
            <a href="/" className="hover:opacity-100">Home</a>
            <a href="/setup" className="hover:opacity-100">Setup</a>
            <a href="/play" className="hover:opacity-100">Play</a>
          </nav>
        </div>
      </header>
      <main className="container py-7">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

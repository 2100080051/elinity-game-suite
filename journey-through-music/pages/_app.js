import '../styles/globals.css';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <div className="min-h-screen bg-ink-900">
      <div className="app-bg"></div>
      <div className="dot-overlay"></div>
      <div className="aurora-veil"></div>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0b1220" />
      </Head>
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a className="flex items-center gap-3" href="/" aria-label="Journey through Music Home">
            <span className="brand-mark">
              <span className="brand-text">Elinity</span>
              <span aria-hidden className="brand-reflection">Elinity</span>
            </span>
            <div className="text-slate-300">· Journey through Music</div>
          </a>
          <nav className="text-sm text-slate-300">
            <span className="hidden sm:inline text-slate-400 mr-3 inline-flex items-center gap-2"><span className="pulse-dot"></span>elinity ai</span>
            <a className="hover:text-white transition-colors" href="/">Home</a>
          </nav>
        </div>
      </header>
      <main className="relative z-10">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

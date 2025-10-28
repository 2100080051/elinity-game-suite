import '../styles/globals.css';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <div className="min-h-screen">
      <div className="app-bg"></div>
      <div className="grid-overlay"></div>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0b14" />
        <title>Creative Duel Arena · elinity</title>
      </Head>
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a className="header-brand" href="/">
            <span className="brand-mark"><span className="brand-text">Elinity</span><span aria-hidden className="brand-reflect">Elinity</span></span>
            <span className="text-slate-300">· Creative Duel Arena</span>
          </a>
          <nav className="text-sm text-slate-300">
            <span className="hidden sm:inline text-slate-400 mr-3 inline-flex items-center gap-2"><span className="pulse-dot"></span>elinity ai</span>
            <a className="hover:text-white transition-colors" href="/">Home</a>
          </nav>
        </div>
        <div className="scanline" />
      </header>
      <main className="relative z-10">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

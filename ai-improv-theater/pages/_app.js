import '../styles/globals.css'
import Head from 'next/head'

export default function MyApp({ Component, pageProps }) {
  return (
    <div className="min-h-screen">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>AI Improv Theater</title>
      </Head>
      <div className="mask-watermark" aria-hidden>
        <div className="mask">🎭</div>
      </div>
      <header className="container py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="elinity-badge elinity-badge--xl elinity-badge--glow">
            <span className="elinity-dot"/> ELINITY
          </div>
          <span className="text-white/80">AI Improv Theater</span>
        </div>
      </header>
      <main className="container pb-10">
        <Component {...pageProps} />
      </main>
      <footer className="container py-8 text-xs text-white/70">
        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <div>Director: ElinityAI • PG-13 • JSON-safe</div>
          <div className="hidden sm:block">Tip: Use the Escalate button for chaos</div>
        </div>
      </footer>
    </div>
  )
}

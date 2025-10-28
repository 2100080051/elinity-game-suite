import '../styles/globals.css';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    document.documentElement.classList.add('bg-oracle-indigo');
  }, []);

  return (
    <div className="min-h-screen relative">
      <div className="app-bg" />
      <div className="star-dots" />
      <header className="sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="crystal" />
            <div>
              <div className="text-2xl font-semibold tracking-wide">
                <span className="text-white">E</span>linity
              </div>
              <div className="text-xs uppercase tracking-wider text-white/70">elinity ai</div>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

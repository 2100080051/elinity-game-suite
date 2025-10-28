import '../styles/globals.css';
import Head from 'next/head';
import { useRouter } from 'next/router';

function TopBar(){
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-black/30 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 select-none">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ocean via-orchid to-dawn shadow-glow" />
          <div className="leading-tight">
            <div className="text-white font-semibold tracking-wide">Mood Journey</div>
            <div className="text-[11px] text-white/60">Flow through feelings with ElinityAI</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={()=>router.push('/')}>◀ Back</button>
        </div>
      </div>
    </header>
  );
}

export default function App({ Component, pageProps }){
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Mood Journey — Flow through feelings with ElinityAI</title>
      </Head>
      <TopBar />
      <main className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Component {...pageProps} />
        </div>
      </main>
    </>
  );
}

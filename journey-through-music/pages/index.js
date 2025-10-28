import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [mood, setMood] = useState('calm');
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      // Step 1: Analyze music (creates session)
      const a = await fetch('/api/analyze_music', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playlistUrl, mood }) });
      const analyzed = await a.json();
      if (!analyzed?.id) return;
      // Step 2: Generate first scene
      await fetch('/api/generate_scene', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: analyzed.id }) });
      // Go play
      router.push(`/play?id=${analyzed.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <Head>
        <title>Journey through Music · elinity</title>
        <meta name="description" content="A meditative, music-driven sandbox where your mood shapes a living canvas." />
      </Head>
      <div className="text-center mb-10 animate-fadeUp">
        <div className="text-sm uppercase tracking-wider text-slate-400 mb-2">elinity</div>
        <h1 className="text-4xl sm:text-5xl font-semibold">
          Sculpt your own <span className="brand">soundscape</span>
        </h1>
        <p className="text-slate-300 mt-3">Paste a playlist (or skip), pick a mood, and let the world bloom.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="panel p-6 animate-fadeUp">
          <label className="block text-sm text-slate-300 mb-2">Playlist URL (Spotify, YT, etc.)</label>
          <input value={playlistUrl} onChange={e=>setPlaylistUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 focus:outline-none focus:ring-2 focus:ring-sky-300" />

          <div className="mt-6">
            <label className="block text-sm text-slate-300 mb-2">Mood</label>
            <div className="flex gap-3">
              {['calm','joyful','dreamy'].map(m => (
                <button key={m} onClick={()=>setMood(m)} className={`btn ${mood===m?'bg-white/15 border-white/20':''}`}>
                  <span className="w-2 h-2 rounded-full bg-sky-300 inline-block mr-2"></span>
                  {m[0].toUpperCase()+m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button onClick={start} disabled={loading} className="btn px-5 py-3 text-base">
              {loading? 'Starting…' : 'Start Journey'}
            </button>
            <button onClick={()=>{ setPlaylistUrl(''); setMood('calm'); }} className="btn">Reset</button>
          </div>
        </div>

        <div className="panel p-6 relative overflow-hidden">
          <div className="absolute -top-10 right-0 w-[140%] h-48 bg-gradient-to-r from-sky-300/10 to-indigo-300/10 blur-3xl animate-wave" style={{transform:'translateX(0)'}}></div>
          <div className="relative z-10">
            <h3 className="text-lg font-medium mb-2">What to expect</h3>
            <ul className="text-slate-300 space-y-2">
              <li>• A living canvas reacts to your choices and the vibe.</li>
              <li>• Calm narration guides breathing and focus.</li>
              <li>• Suggestions invite playful interactions.</li>
            </ul>
            <div className="text-xs text-slate-400 mt-4">powered by elinity ai</div>
          </div>
        </div>
      </div>
    </div>
  );
}

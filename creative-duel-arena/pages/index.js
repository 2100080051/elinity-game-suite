import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const [players, setPlayers] = useState(['','']);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function updateName(i, v) {
    const copy = players.slice(); copy[i] = v; setPlayers(copy);
  }

  function addPlayer() {
    if (players.length >= 6) return; setPlayers([...players, '']);
  }

  async function start() {
    setLoading(true);
    try {
      const names = players.map(p=>p.trim()).filter(Boolean);
      const res = await fetch('/api/start_game', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ players: names }) });
      const data = await res.json();
      if (data?.id) router.push(`/arena?id=${data.id}`);
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <Head>
        <title>Creative Duel Arena · elinity</title>
      </Head>
      <div className="text-center mb-10 fade-in">
        <div className="text-sm uppercase tracking-wider text-slate-400 mb-2">elinity</div>
        <h1 className="text-5xl font-semibold">Creative Duel Arena</h1>
        <p className="text-slate-300 mt-2">Imagination is your weapon. Gather your crew and enter the neon arena.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="panel p-6 fade-in">
        <div className="grid sm:grid-cols-2 gap-4">
          {players.map((p, i) => (
            <input key={i} value={p} onChange={e=>updateName(i, e.target.value)} placeholder={`Player ${i+1}`} className="px-4 py-3 rounded-lg bg-black/30 border border-white/10" />
          ))}
        </div>
        <div className="flex gap-3 mt-4">
            <button onClick={addPlayer} className="btn">Add Player</button>
            <button onClick={start} disabled={loading} className="btn btn-primary">{loading? 'Starting…' : 'Enter Arena'}</button>
        </div>
        </div>

        <div className="panel p-6 relative overflow-hidden fade-in">
          <div className="wave-bg">
            <div className="wave" style={{top:'10%'}}></div>
            <div className="wave"></div>
            <div className="wave"></div>
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-medium mb-2">How it works</h3>
            <ul className="text-slate-300 space-y-2">
              <li>• AI drops a fresh creative prompt each round.</li>
              <li>• Players submit quick entries. Keep it witty.</li>
              <li>• ElinityAI judges, awards points, and updates the leaderboard.</li>
            </ul>
            <div className="mt-6">
              <div className="text-sm text-slate-400 mb-2">Arena charge</div>
              <div className="energy-bar"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

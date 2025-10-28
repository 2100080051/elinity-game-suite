import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Home(){
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const router = useRouter();

  useEffect(()=>{ (async()=>{ const r = await fetch('/api/create_room', { method:'POST' }); const d = await r.json(); setRoomId(d.roomId); })(); },[]);

  async function start(){
    if (!roomId) return; setJoining(true);
    const res = await fetch('/api/join_room', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ roomId, name: name||'MC' }) });
    const data = await res.json(); setJoining(false);
    router.push(`/arena/${roomId}?playerId=${encodeURIComponent(data.playerId)}`);
  }

  return (
    <div className="space-y-8">
      <section className="text-center">
        <div className="badge mb-2">Neon Rap Arena</div>
        <h1 className="text-4xl md:text-6xl font-semibold">🎧 AI Rap Battle — Elinity Arena</h1>
        <p className="text-white/70 mt-2">Freestyle, prompts, hype DJ, and dramatic winners — no studio needed.</p>
        <div className="mt-5 flex flex-wrap gap-3 justify-center">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your MC name" className="input w-64" />
          <button className="btn-primary" onClick={start} disabled={joining || !roomId}>{joining? 'Joining…' : 'Enter the Arena'}</button>
        </div>
      </section>

      <div className="panel p-4">
        <div className="text-white/70 text-sm">Modes</div>
        <ul className="list-disc list-inside text-white/80 space-y-1 mt-1">
          <li>Solo Freestyle — AI judges</li>
          <li>Crew Battle — 2–6 players</li>
          <li>Audience Mode — emoji votes</li>
          <li>Remix Mode — AI adds a verse</li>
        </ul>
      </div>
    </div>
  );
}

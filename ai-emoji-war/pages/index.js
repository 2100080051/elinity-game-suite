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
    const res = await fetch('/api/join_room', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ roomId, name: name||'Player' }) });
    const data = await res.json(); setJoining(false);
    router.push(`/room/${roomId}?playerId=${encodeURIComponent(data.playerId)}`);
  }

  return (
    <div className="space-y-8">
      <section className="text-center">
        <div className="badge mb-2">Neon Chat Arena</div>
        <h1 className="text-4xl md:text-6xl font-semibold">⚔️ AI Emoji War — Let the Chaos Begin!</h1>
        <p className="text-white/70 mt-2">Words are banned. Emojis rule. The narrator makes sense of the nonsense.</p>
        <div className="mt-5 flex flex-wrap gap-3 justify-center">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="input w-64" />
          <button className="btn-primary" onClick={start} disabled={joining || !roomId}>{joining? 'Joining…' : '🔥 Start Game'}</button>
        </div>
      </section>

      <div className="panel p-4">
        <div className="text-white/70 text-sm">Rules</div>
        <ul className="list-disc list-inside text-white/80 space-y-1 mt-1">
          <li>Emoji-only: no words. Keep it friendly.</li>
          <li>Short, snappy rounds. Fun over logic.</li>
          <li>Chaos Mode may appear at any time.</li>
        </ul>
      </div>
    </div>
  );
}

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Home(){
  const [sessionId, setSessionId] = useState('');
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const router = useRouter();

  useEffect(()=>{ (async()=>{ const r = await fetch('/api/create_session', { method:'POST' }); const d = await r.json(); setSessionId(d.sessionId); })(); },[]);

  async function start(){
    if (!sessionId) return; setJoining(true);
    const res = await fetch('/api/join', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, name: name||'Traveler' }) });
    const data = await res.json(); setJoining(false);
    router.push(`/session/${sessionId}?playerId=${encodeURIComponent(data.playerId)}`);
  }

  return (
    <div className="space-y-8">
      <section className="text-center">
        <div className="badge mb-2">Serene Timeline Studio</div>
        <h1 className="text-4xl md:text-6xl font-semibold font-serif">🕰️ Truth Timeline</h1>
        <p className="text-white/70 mt-2">Where your memories become art — past, present, and the shimmering future.</p>
        <div className="mt-5 flex flex-wrap gap-3 justify-center">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="input w-64" />
          <button className="btn-primary" onClick={start} disabled={joining || !sessionId}>{joining? 'Joining…' : '✨ Begin Session'}</button>
        </div>
      </section>

      <div className="panel p-4">
        <div className="text-white/70 text-sm">How it works</div>
        <ul className="list-disc list-inside text-white/80 space-y-1 mt-1">
          <li>AI offers a prompt from Past, Present, or Future.</li>
          <li>You add a memory or dream; AI weaves a poetic node.</li>
          <li>Watch your shared timeline glow to life.</li>
        </ul>
      </div>
    </div>
  );
}

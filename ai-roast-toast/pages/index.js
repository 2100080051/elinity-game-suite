import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

export default function Home(){
  const [gameId, setGameId] = useState('');
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [demoPrompt, setDemoPrompt] = useState('');
  const [showRules, setShowRules] = useState(false);
  const router = useRouter();

  useEffect(()=>{ (async ()=>{
    const res = await fetch('/api/new_game', { method:'POST' });
    const data = await res.json();
    setGameId(data.gameId);
  })(); },[]);

  async function add(){
    if (!name.trim()) return;
    const res = await fetch('/api/add_player', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ gameId, name }) });
    const data = await res.json();
    setPlayers(p=>[...p, data.player]);
    setName('');
  }

  async function start(){
    if (!gameId) return;
    router.push(`/play?gameId=${encodeURIComponent(gameId)}`);
  }

  async function randomDemo(){
    const who = players[players.length-1]?.name || 'Alex';
    const res = await fetch(`/api/random_prompt?name=${encodeURIComponent(who)}`);
    const data = await res.json();
    setDemoPrompt(data.prompt);
  }

  const subtitle = useMemo(()=> 'Where humor meets heart.', []);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-70" aria-hidden>
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-gradient-to-br from-club-neon/30 to-club-gold/30 blur-3xl" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-3xl" />
        </div>
        <div className="text-center">
          <div className="badge mb-3">Elinity AI — Party Host</div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">🔥 AI Roast & Toast</h1>
          <p className="text-white/70 mt-2">{subtitle}</p>
          <div className="mt-5 flex flex-wrap gap-3 justify-center">
            <button className="btn-primary" onClick={start}>🎤 Start Game</button>
            <button className="btn" onClick={()=>setShowRules(s=>!s)}>📜 Rules</button>
            <button className="btn" onClick={randomDemo}>🎲 Random Prompt Demo</button>
          </div>
        </div>
      </section>

      {showRules && (
        <div className="panel p-4">
          <div className="text-white/80 font-semibold mb-2">How it works</div>
          <ul className="list-disc list-inside text-white/80 space-y-1">
            <li>Each round, ElinityAI picks a target player and a playful prompt.</li>
            <li>Everyone writes a friendly roast (1–2 lines max).</li>
            <li>ElinityAI replies with a warm toast to keep the vibes positive.</li>
            <li>Keep it kind, keep it fun — no sensitive topics.</li>
          </ul>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="panel p-4">
          <div className="text-white/70 text-sm mb-2">Add Players</div>
          <div className="flex gap-2">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="input" />
            <button className="btn-primary" onClick={add}>Add</button>
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {players.map(p=> (
              <div key={p.id} className="badge">{p.name}</div>
            ))}
          </div>
        </div>
        <div className="panel p-4">
          <div className="text-white/70 text-sm mb-2">Random Prompt Demo</div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            {demoPrompt ? <div className="text-white/90">🔥 {demoPrompt}</div> : <div className="text-white/60">Click the demo button to see an example roast prompt.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

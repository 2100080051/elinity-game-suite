import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
const MiniMap = dynamic(()=>import('../components/MiniMap'),{ ssr:false });

export default function Lobby(){
  const [games, setGames] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const dailySeed = useMemo(()=>{
    const d = new Date(); const y=d.getUTCFullYear(); const m=d.getUTCMonth()+1; const day=d.getUTCDate();
    return `daily-${y}-${m}-${day}`;
  },[]);
  const router = useRouter();

  async function refresh(){
    const res = await fetch('/api/list_games');
    const data = await res.json();
    setGames(data.games || []);
  }
  useEffect(()=>{ refresh(); const t = setInterval(refresh, 4000); return ()=>clearInterval(t); },[]);

  async function createGame(){
    setLoading(true);
    const res = await fetch('/api/create_game', { method:'POST' });
    const data = await res.json();
    setLoading(false);
    await join(data.id);
  }

  async function join(gameId){
    const res = await fetch('/api/join_game', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ gameId, name }) });
    const data = await res.json();
    router.push(`/game/${data.gameId}?playerId=${encodeURIComponent(data.playerId)}`);
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-70" aria-hidden>
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-gradient-to-br from-lab-neon/30 to-lab-amber/30 blur-3xl" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-3xl" />
        </div>
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div className="text-center md:text-left">
            <div className="badge mb-3">Elinity AI — Labyrinth Orchestrator</div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
              Decode the maze. Win together.
            </h1>
            <p className="text-white/70 mt-3">Each player sees a different slice of the world. Share sharp clues. Try bold moves. Watch paths unlock.</p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <button className="btn-primary" disabled={loading} onClick={createGame}>{loading? 'Creating…' : 'Start a Room'}</button>
              <button className="btn" onClick={refresh}>Find Rooms</button>
            </div>
            <ul className="mt-4 text-white/70 text-sm grid grid-cols-2 gap-x-6 gap-y-1">
              <li>30–50 node worlds</li>
              <li>Keys, switches, mirrors</li>
              <li>Locked edges, hidden exits</li>
              <li>AI Orchestrator with fallbacks</li>
            </ul>
          </div>
          <MiniMap seed={dailySeed} />
        </div>
      </section>

      <div className="panel p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name (optional)" className="w-full md:w-auto flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-white/20" />
          <div className="flex gap-3">
            <button className="btn-primary" disabled={loading} onClick={createGame}>{loading ? 'Create Room…' : 'Create Room'}</button>
            <button className="btn" onClick={refresh}>Refresh</button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {games.map(g => (
          <div key={g.id} className="panel p-4 flex flex-col justify-between">
            <div>
              <div className="text-sm text-white/60">Seed</div>
              <div className="text-white/85 font-mono">{g.seed}</div>
              <div className="mt-2 text-sm text-white/70">Players: {g.players}</div>
            </div>
            <div className="pt-3"><button className="btn-primary w-full" onClick={()=>join(g.id)}>Join</button></div>
          </div>
        ))}
        {games.length===0 && (
          <div className="text-white/60 text-sm">No rooms yet. Be the first to create one.</div>
        )}
      </div>
    </div>
  );
}

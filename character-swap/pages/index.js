import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home(){
  const [players, setPlayers] = useState(['You','Partner']);
  const router = useRouter();

  const start = async ()=>{
    const r = await fetch('/api/session', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ players }) });
    const j = await r.json();
    if (!r.ok) return alert(j.error||'Failed');
    router.push(`/play?id=${j.session?.id}`);
  };

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="card-inner">
          <h1 className="title">Character Swap</h1>
          <p className="mt-2 opacity-90">Trade personalities and act out scenario-driven scenes. An AI moderator watches the performances and scores humor, empathy, and consistency.</p>
          <div className="mt-4 space-y-2">
            <label className="opacity-80 text-sm">Players</label>
            <div className="flex gap-2 flex-wrap">
              {players.map((p,i)=> (
                <input key={i} className="input" value={p} onChange={e=>{ const arr=[...players]; arr[i]=e.target.value; setPlayers(arr); }} />
              ))}
              <button className="btn btn-secondary" onClick={()=> setPlayers(p=>[...p, `P${p.length+1}`])}>Add Player</button>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button className="btn btn-primary" onClick={start}>Start Game</button>
            <a className="btn btn-secondary" href="/play">Open Current</a>
          </div>
        </div>
      </div>
    </div>
  );
}

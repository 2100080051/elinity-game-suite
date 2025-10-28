import { useState } from 'react';

export default function Setup(){
  const [players, setPlayers] = useState(['Player A','Player B','Player C','Player D']);
  const [hintThreshold, setHintThreshold] = useState(3);
  const [loading, setLoading] = useState(false);

  async function start(){
    setLoading(true);
    try{
      const res = await fetch('/api/round/start', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ players, hintThreshold })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error||'Failed to start');
      localStorage.setItem('hiddenq.round', data.round?.id);
      window.location.href = '/play';
    }catch(e){
      alert(e.message);
    }finally{ setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Setup</h1>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="note animate-bob">
          <div className="note-inner space-y-3">
            <div className="label">Players</div>
            {players.map((p,i)=> (
              <input key={i} className="input" value={p} onChange={e=>{
                const next=[...players]; next[i]=e.target.value; setPlayers(next);
              }} />
            ))}
            <button className="btn btn-secondary" onClick={()=> setPlayers(p=>[...p,'Player '+String.fromCharCode(65+p.length)])}>Add Player</button>
          </div>
        </div>
        <div className="note">
          <div className="note-inner space-y-3">
            <div className="label">Hints</div>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="5" value={hintThreshold} onChange={e=> setHintThreshold(parseInt(e.target.value))} />
              <span className="opacity-80">After {hintThreshold} misses</span>
            </div>
            <button className="btn btn-primary" onClick={start} disabled={loading}>{loading? 'Starting…':'Start Round'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

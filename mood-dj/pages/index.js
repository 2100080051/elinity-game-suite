import { useMemo, useState } from 'react';

const EMOJI = {
  happy:'😊', relaxed:'😌', energetic:'⚡', nostalgic:'📼', dreamy:'💫', edgy:'🗡️', curious:'🧠'
};
const MOODS = Object.keys(EMOJI);

export default function Home(){
  const [players, setPlayers] = useState(['Player A','Player B','Player C']);
  const [selections, setSelections] = useState({});
  const [loading, setLoading] = useState(false);

  function setMood(i, mood){ setSelections(s=> ({...s, [i]: mood })); }
  function allChosen(){ return players.every((_,i)=> selections[i]); }

  async function start(){
    if(!allChosen()) return alert('Pick moods for all players');
    setLoading(true);
    try{
      const payload = players.map((p,i)=> ({ player_id: p, mood: selections[i] }));
      const res = await fetch('/api/round/start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ player_moods: payload }) });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error||'Failed');
      localStorage.setItem('mooddj.round', data.round?.id);
      window.location.href = '/mix';
    }catch(e){ alert(e.message);}finally{ setLoading(false);}
  }

  return (
    <div className="space-y-6">
      <div className="panel">
        <div className="panel-inner">
          <h1 className="text-3xl md:text-4xl font-semibold">Mood DJ</h1>
          <p className="opacity-80 mt-2">Pick a mood to kick off the jam. Each selection triggers a quick loading beat while the AI composes.</p>
          <div className="mt-4 grid md:grid-cols-3 gap-4">
            {players.map((p,i)=> (
              <div key={i} className="panel">
                <div className="panel-inner">
                  <div className="label">{p}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {MOODS.map(m=> (
                      <button key={m} className={`chip ${selections[i]===m? 'chip-active':''}`} onClick={()=> setMood(i,m)}>
                        <span className="mr-1">{EMOJI[m]}</span>{m}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 h-6 flex items-center gap-2 opacity-80">
                    {selections[i] ? (<>
                      <span className="animate-beat">{EMOJI[selections[i]]}</span>
                      <div className="eq">
                        <div className="bar" style={{animationDelay:'0s'}} />
                        <div className="bar" style={{animationDelay:'.2s'}} />
                        <div className="bar" style={{animationDelay:'.4s'}} />
                        <div className="bar" style={{animationDelay:'.1s'}} />
                        <div className="bar" style={{animationDelay:'.3s'}} />
                      </div>
                      <span>Composing…</span>
                    </>) : <span>Choose a mood</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button className="btn btn-secondary" onClick={()=> setPlayers(p=>[...p, `Player ${String.fromCharCode(65+p.length)}`])}>Add Player</button>
            <button className="btn btn-primary" onClick={start} disabled={!allChosen()||loading}>{loading? 'Starting…':'Lock Moods & Generate'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

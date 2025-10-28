import { useState } from 'react';
import { useRouter } from 'next/router';

const TYPES = ['word','image','logic'];
const DIFFS = ['easy','medium','hard','custom'];

export default function Home(){
  const [type, setType] = useState('word');
  const [diff, setDiff] = useState('easy');
  const [diffVal, setDiffVal] = useState(1); // 1-easy, 2-medium, 3-hard
  const [mode, setMode] = useState('solo');
  const [players, setPlayers] = useState(['You']);
  const router = useRouter();

  const start = async ()=>{
    const r = await fetch('/api/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type, difficulty_preference: diff, mode, players }) });
    const j = await r.json();
    if (!r.ok) return alert(j.error||'Failed');
    router.push(`/play?id=${j.session?.id}&p=${j.puzzle?.id}`);
  };

  const onDiffSlide = (v)=>{
    const n = Number(v);
    setDiffVal(n);
    setDiff(n===1?'easy': n===2?'medium':'hard');
  };

  return (
    <div className="space-y-5">
      <div className="card animate-fadeInUp">
        <div className="card-inner">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold drop-shadow-[0_0_12px_rgba(34,211,238,0.45)]">AI Puzzle Architect</h1>
            <span className="ribbon">New Game</span>
          </div>
          <p className="mt-1 text-white/80">Create on-demand word, image, or logic puzzles that auto-adapt to your skill.</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Puzzle Type</label>
              <select className="select w-full" value={type} onChange={e=>setType(e.target.value)}>
                {TYPES.map(t=> <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Target Difficulty <span className="ml-2 badge">{diff}</span></label>
              <input type="range" min="1" max="3" step="1" value={diffVal} onChange={e=>onDiffSlide(e.target.value)} className="slider" />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>Easy</span><span>Medium</span><span>Hard</span>
              </div>
            </div>
            <div>
              <label className="label">Mode</label>
              <div className="flex gap-2">
                <button className={`btn btn-secondary ${mode==='solo'?'ring-2 ring-neon-cyan/50':''}`} onClick={()=>setMode('solo')}>Solo</button>
                <button className={`btn btn-secondary ${mode==='group'?'ring-2 ring-neon-magenta/50':''}`} onClick={()=>setMode('group')}>Group</button>
              </div>
            </div>
          </div>
          {mode==='group' && (
            <div className="mt-3">
              <label className="label">Players</label>
              <div className="flex gap-2 flex-wrap">
                {players.map((p,i)=> (
                  <input key={i} className="input" value={p} onChange={e=>{
                    const arr=[...players]; arr[i]=e.target.value; setPlayers(arr);
                  }} />
                ))}
                <button className="btn btn-secondary" onClick={()=> setPlayers(p=>[...p, `P${p.length+1}`])}>Add Player</button>
              </div>
            </div>
          )}
          <div className="mt-5 flex gap-3">
            <button className="btn btn-primary btn-lg" onClick={start}>Generate</button>
            <a className="btn btn-secondary btn-lg" href="/play">Open Current</a>
          </div>
        </div>
      </div>
    </div>
  );
}

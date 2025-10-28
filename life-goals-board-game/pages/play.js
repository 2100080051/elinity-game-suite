import { useEffect, useRef, useState } from 'react';

function Grid({ size, board, current }){
  return (
    <div className={`grid grid-cols-5 gap-2`}>
      {board.map(cell => (
        <div key={cell.index} className={`tile ${current===cell.index?'tile-active':''}`}>
          <div className="text-center">
            <div className="text-xs opacity-80">{cell.index}</div>
            <div className="text-sm">{cell.title || 'Goal Space'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Play(){
  const [game, setGame] = useState(null);
  const [md, setMd] = useState('');
  const [summary, setSummary] = useState('');
  const [desc, setDesc] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(()=>{ (async()=>{
    try{
      const r = await fetch('/api/game', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({}) });
      const j = await r.json(); if(!r.ok) throw new Error(j.error||'Failed to start');
      setGame(j.game); setMd(j.markdown||'');
    }catch(e){ setError(e.message); }
  })(); }, []);

  const roll = async ()=>{
    setError('');
    const r = await fetch('/api/game/roll', { method:'POST' });
    const j = await r.json(); if(!r.ok) return setError(j.error||'Roll failed');
    setGame(j.game); setMd(j.markdown||'');
    setSummary(`Player ${j.player} rolled ${j.roll}, moved to Space ${j.space}.`);
  };

  const saveTitle = async ()=>{
    if (!game) return; const idx = game.current_space;
    await fetch('/api/game/goal', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ index: idx, title: goalTitle }) });
    setGame(g=> ({...g, goals: { ...g.goals, [idx]: goalTitle }, board: g.board.map(c=> c.index===idx? { ...c, title: goalTitle }: c) }));
    setGoalTitle('');
  };

  const submit = async ()=>{
    setError('');
    const r = await fetch('/api/game/describe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ description: desc }) });
    const j = await r.json(); if(!r.ok) return setError(j.error||'Describe failed');
    setGame(j.game); setMd(j.markdown||''); setDesc(''); setSummary(`AI Journey generated for ${j.player} on Space ${j.space}. Next: ${j.next_player}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 grid lg:grid-cols-5 gap-6">
      <section className="lg:col-span-3 card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Board</h2>
          <button className="btn" onClick={roll}>🎲 Roll Dice</button>
        </div>
        {!game ? <div className="opacity-80">Loading…</div> : (
          <div>
            <Grid size={game.size} board={game.board} current={game.current_space} />
            <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="font-medium">Turn Summary</div>
              <div className="text-sm opacity-80">{summary || 'Press Roll Dice to begin.'}</div>
            </div>
          </div>
        )}
      </section>
      <section className="lg:col-span-2 space-y-4">
        <div className="card p-5">
          <h3 className="font-medium mb-2">Goal Detail</h3>
          {!game ? null : (
            <div>
              <div className="text-sm opacity-80 mb-1">Space {game.current_space}</div>
              <div className="mb-2">{game.goals[game.current_space] || 'Untitled'}</div>
              <div className="flex gap-2">
                <input value={goalTitle} onChange={e=>setGoalTitle(e.target.value)} placeholder="Name this Goal Space" className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10"/>
                <button className="btn" onClick={saveTitle}>Save</button>
              </div>
            </div>
          )}
        </div>
        <div className="card p-5">
          <h3 className="font-medium mb-2">Your 30-second plan</h3>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={4} placeholder="3 sentences on how you'd achieve this goal…" className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10" />
          <div className="mt-3 flex gap-3"><button className="btn" onClick={submit}>Submit</button></div>
        </div>
        <div className="card p-5">
          <h3 className="font-medium mb-2">Facilitator</h3>
          <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm opacity-90">{md}</div>
        </div>
        {error ? <div className="text-sm text-red-300">{error}</div> : null}
      </section>
    </div>
  );
}

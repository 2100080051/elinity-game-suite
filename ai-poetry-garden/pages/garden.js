import { useEffect, useMemo, useState } from 'react';

function SeedPot({seed, onGrow}){
  return (
    <div className="pot">
      <div className="pot-inner">
        <div className="seed truncate" title={seed.seed_text}>{seed.seed_text}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="sprout">🌱 Seed • {seed.player_id}</span>
          <button className="btn btn-secondary" onClick={()=> onGrow(seed)}>Grow</button>
        </div>
      </div>
    </div>
  );
}

export default function Garden(){
  const [players, setPlayers] = useState(['A','B','C']);
  const [seeds, setSeeds] = useState({});
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(false);
  const [growing, setGrowing] = useState(false);
  const [garden, setGarden] = useState(null);

  function allSeeded(){ return players.every((p,i)=> (seeds[i]||'').trim()); }

  async function start(){
    if(!allSeeded()) return alert('Please add a seed line for each player');
    setLoading(true);
    try{
      const payload = players.map((p,i)=> ({ player_id: `Player ${p}`, seed_text: seeds[i] }));
      const res = await fetch('/api/garden/start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ seeds: payload }) });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error||'Failed');
      setRound(data.round);
    }catch(e){ alert(e.message);}finally{ setLoading(false); }
  }

  async function grow(){
    if(!round) return;
    setGrowing(true);
    try{
      const res = await fetch('/api/garden/grow', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ round_number: round.round_number }) });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error||'Failed');
      setRound(data.round);
      await loadState();
    }catch(e){ alert(e.message);}finally{ setGrowing(false); }
  }

  async function loadState(){
    const r = await fetch('/api/garden/state');
    const d = await r.json();
    setGarden(d.garden);
  }
  useEffect(()=>{ loadState(); },[]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="poem">
        <div className="poem-inner">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="label">The Garden</div>
              <div className="text-2xl font-semibold mt-1">Grow poems from tiny seeds</div>
            </div>
            {garden && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-sm">
                <span>Rounds: {garden.stats.total_rounds}</span>
                <span className="opacity-60">•</span>
                <span>Poems: {garden.stats.total_poems}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Seed Board */}
      {!round && (
        <div className="poem">
          <div className="poem-inner">
            <div className="text-xl font-semibold">Seed Board</div>
            <div className="mt-3 grid md:grid-cols-3 gap-3">
              {players.map((p,i)=> (
                <div key={i} className="pot">
                  <div className="pot-inner">
                    <div className="label mb-1">Player {p}</div>
                    <input className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/60" placeholder="Write a seed line…" value={seeds[i]||''} onChange={e=> setSeeds(s=> ({...s, [i]: e.target.value}))} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button className="btn btn-secondary" onClick={()=> setPlayers(p=> [...p, String.fromCharCode(65+p.length)])}>Add Player</button>
              <button className="btn btn-primary" onClick={start} disabled={!allSeeded()||loading}>{loading? 'Planting…':'Plant Seeds'}</button>
            </div>
          </div>
        </div>
      )}

      {round && (
        <div className="space-y-5">
          <div className="poem">
            <div className="poem-inner">
              <div className="text-xl font-semibold">🌱 Round {round.round_number}</div>
              <div className="label mt-2">Seed Pots</div>
              <div className="mt-2 grid md:grid-cols-3 gap-3">
                {round.seeds.map(s=> (
                  <SeedPot key={s.seed_id} seed={s} onGrow={()=> grow()} />
                ))}
              </div>
              {!round.poems?.length && (
                <div className="mt-4 flex items-center gap-3">
                  <button className="btn btn-primary" onClick={grow} disabled={growing}>{growing? 'Growing…':'Grow All'}</button>
                </div>
              )}
            </div>
          </div>

          {round.poems?.length>0 && (
            <div className="space-y-3">
              {round.poems.map(p=> (
                <div key={p.seed_id} className="poem animate-bloom">
                  <div className="poem-inner">
                    <div className="label">Seed</div>
                    <div className="opacity-90">{round.seeds.find(s=> s.seed_id===p.seed_id)?.seed_text}</div>
                    <div className="label mt-3">Poem</div>
                    <div className="whitespace-pre-wrap">
                      {p.poem}
                    </div>
                    <div className="caption mt-3">Visual: {p.visual_text}{p.image_url? ` — ${p.image_url}`:''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sidebar / Archive */}
      {garden && (
        <div className="archive">
          <div className="p-4">
            <div className="text-lg font-semibold">Archive</div>
            <div className="text-white/70 text-sm">Rounds: {garden.stats.total_rounds} • Poems: {garden.stats.total_poems}</div>
          </div>
          {garden.rounds.map(r=> (
            <div key={r.round_number} className="archive-item p-4">
              <div className="font-semibold">Round {r.round_number}</div>
              <div className="text-white/70 text-sm">{r.poems?.[0]?.poem?.split('\n')[0] || 'No poems yet.'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

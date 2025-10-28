import { useEffect, useMemo, useState } from 'react';

function useRoundId(){
  const [id, setId] = useState(null);
  useEffect(()=>{ setId(localStorage.getItem('mooddj.round')); },[]);
  return id;
}

export default function Mix(){
  const roundId = useRoundId();
  const [round, setRound] = useState(null);
  const [selected, setSelected] = useState([]);
  const [tempo, setTempo] = useState(0);
  const [filter, setFilter] = useState('none');
  const [layering, setLayering] = useState('blend');
  const [mixing, setMixing] = useState(false);
  const [finalMix, setFinalMix] = useState(null);
  const [scoring, setScoring] = useState(false);
  const [score, setScore] = useState(null);

  async function load(){
    if(!roundId) return;
    const r = await fetch(`/api/round/${roundId}`);
    const d = await r.json();
    setRound(d.round);
  }
  useEffect(()=>{ load(); },[roundId]);

  function toggle(t){
    setSelected(sel=> sel.includes(t.track_id) ? sel.filter(id=> id!==t.track_id) : [...sel, t.track_id]);
  }

  async function remix(){
    setMixing(true);
    try{
      const res = await fetch('/api/round/remix', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ round_id: round.id, remix: { tracks: selected, tempo, filter, layering } }) });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error||'Failed');
      setFinalMix(data.final_mix);
      await load();
    }catch(e){ alert(e.message);}finally{ setMixing(false); }
  }

  async function finalize(){
    setScoring(true);
    try{
      const res = await fetch('/api/round/score', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ round_id: round.id }) });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error||'Failed');
      setScore(data.score);
      await load();
    }catch(e){ alert(e.message);}finally{ setScoring(false); }
  }

  if(!roundId){
    return <div className="panel"><div className="panel-inner"><div className="text-lg font-semibold">No active party</div><a href="/" className="btn btn-primary mt-3 inline-flex">Start New Party</a></div></div>;
  }
  if(!round) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Gallery */}
        <div className="lg:col-span-2 panel">
          <div className="panel-inner">
            <div className="flex items-center justify-between">
              <div className="label">Track & Visual Gallery</div>
              <div className="eq"><div className="bar"/><div className="bar" style={{animationDelay:'.15s'}}/><div className="bar" style={{animationDelay:'.3s'}}/></div>
            </div>
            <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {round.track_set?.map(t=> (
                <div key={t.track_id} className={`panel ${selected.includes(t.track_id)?'ring-2 ring-prism-500':''}`}>
                  <div className="panel-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span>{t.emoji||'🎵'}</span><div className="font-semibold capitalize">{t.mood}</div></div>
                      <button className="chip" onClick={()=> toggle(t)}>{selected.includes(t.track_id)? 'Remove':'Add'}</button>
                    </div>
                    <audio className="mt-2 w-full" src={t.audio_url||''} controls loop />
                    {t.visual_url && <video className="mt-2 w-full rounded" src={t.visual_url} muted loop autoPlay />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mix Panel */}
        <div className="panel">
          <div className="panel-inner space-y-3">
            <div className="label">Mix Panel</div>
            <div className="flex items-center gap-2">
              <label className="chip">Tempo</label>
              <select className="input" value={tempo} onChange={e=> setTempo(parseInt(e.target.value))}>
                <option value={-20}>-20%</option>
                <option value={-10}>-10%</option>
                <option value={0}>±0%</option>
                <option value={10}>+10%</option>
                <option value={20}>+20%</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="chip">Filter</label>
              <select className="input" value={filter} onChange={e=> setFilter(e.target.value)}>
                <option value="none">None</option>
                <option value="reverb">Reverb</option>
                <option value="echo">Echo</option>
                <option value="vignette">Visual Vignette</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="chip">Layering</label>
              <select className="input" value={layering} onChange={e=> setLayering(e.target.value)}>
                <option value="blend">Blend</option>
                <option value="stack">Stack</option>
                <option value="sidechain">Sidechain</option>
              </select>
            </div>
            <button className="btn btn-primary w-full" onClick={remix} disabled={!selected.length || mixing}>{mixing? 'Mixing…':'Play Mix'}</button>
            {finalMix && (
              <div className="mt-3">
                <div className="label">Preview</div>
                {finalMix.mixed_track_url && <audio className="mt-2 w-full" src={finalMix.mixed_track_url} controls />}
                {finalMix.mixed_visual_url && <video className="mt-2 w-full rounded" src={finalMix.mixed_visual_url} muted loop autoPlay />}
                <button className="btn btn-secondary w-full mt-3" onClick={finalize} disabled={scoring}>{scoring? 'Scoring…':'Finalize & Score'}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Score */}
      {round.score && (
        <div className="panel animate-slideUp">
          <div className="panel-inner">
            <div className="text-lg font-semibold">Party Mood: {round.score.score}/100</div>
            <div className="opacity-80 mt-1">{round.score.feedback}</div>
          </div>
        </div>
      )}

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-studio-900/60 backdrop-blur border-t border-white/10 p-3 flex items-center gap-3 justify-center sm:justify-between">
        <div className="hidden sm:flex items-center gap-3">
          <a className="btn btn-secondary" href="/">New Party</a>
          <button className="btn btn-secondary" onClick={()=> { setSelected([]); setFinalMix(null); setScore(null); }}>Replay Round</button>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary">Save Mix</button>
          <a className="btn btn-secondary sm:hidden" href="/">New</a>
        </div>
      </div>
    </div>
  );
}

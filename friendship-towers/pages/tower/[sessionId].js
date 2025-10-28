import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

const PALETTES = {
  'Sunset Glow': ['#ffc3a0','#ffdf80','#c4b5fd'],
  'Moonlit Calm': ['#a7f3d0','#7dd3fc','#c4b5fd'],
  'Aurora Sky': ['#7dd3fc','#c4b5fd','#ffc3a0']
};

export default function Tower(){
  const router = useRouter();
  const { sessionId } = router.query || {};
  const [state, setState] = useState(null);
  const [players, setPlayers] = useState(['','']);
  const [theme, setTheme] = useState('Gratitude');
  const [palette, setPalette] = useState('Sunset Glow');
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const colors = PALETTES[palette] || PALETTES['Sunset Glow'];

  async function fetchState(){
    if(!sessionId) return;
    try{ const r = await fetch(`/api/state?sessionId=${encodeURIComponent(sessionId)}`); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); setError(''); }
    catch(e){ setError(String(e.message||e)); }
  }
  useEffect(()=>{ if(sessionId) fetchState(); },[sessionId]);

  function updatePlayer(i, val){ const next=[...players]; next[i]=val; setPlayers(next); }
  function addPlayer(){ if(players.length<4) setPlayers([...players,'']); }
  function rmPlayer(i){ const next=[...players]; next.splice(i,1); setPlayers(next); }

  async function start(){
    setLoading(true);
    try{
      const body = { sessionId, players: players.filter(Boolean), theme, palette };
      const r = await fetch('/api/start_session',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j);
    }catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function submit(){
    if(!state?.question) return;
    setLoading(true);
    try{
      const payload = state.players.map(name=> ({ name, text: answers[name]||'' }));
      const r = await fetch('/api/submit_answers',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, answers: payload }) });
      const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); setAnswers({});
    }catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function nextLayer(){
    setLoading(true);
    try{ const r = await fetch('/api/next_layer',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j);}catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function reflect(){
    setLoading(true);
    try{ const r = await fetch('/api/reflect',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); alert(j.summary||'Reflection ready'); }catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function save(){
    try{ const r = await fetch('/api/save_snapshot',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); alert('Snapshot saved (JSON).'); }catch(e){ setError(String(e.message||e)); }
  }

  const tower = state?.tower || [];
  const q = state?.question;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="surface p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="badge">Session: {state?.title || '—'}</div>
            <div className="badge">Round {state?.round || 0}</div>
            <div className="mini-tower hidden md:flex">
              {tower.slice(-8).map((layer,i)=> <div key={i} className="mini" style={{background: layer.color||'white'}} />)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn" onClick={reflect}>🔮 Reflect</button>
            <button className="btn" onClick={save}>📸 Save Snapshot</button>
            <button className="btn" onClick={()=>router.push('/')}>🕯️ Pause</button>
          </div>
        </div>

        {!state?.started && (
          <div className="surface p-6">
            <div className="text-white/70 text-xs tracking-wide">Welcome, builders of bonds.</div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="text-white/80 text-sm">Players</div>
                {players.map((p,i)=> (
                  <div key={i} className="flex items-center gap-2">
                    <input className="input" placeholder={`Player ${i+1} name`} value={p} onChange={e=>updatePlayer(i,e.target.value)} />
                    {players.length>1 && <button className="btn" onClick={()=>rmPlayer(i)}>—</button>}
                  </div>
                ))}
                {players.length<4 && <button className="btn" onClick={addPlayer}>+ Add Player</button>}
              </div>
              <div className="space-y-2">
                <div className="text-white/80 text-sm">Session</div>
                <select className="select" value={theme} onChange={e=>setTheme(e.target.value)}>
                  {['Gratitude','Memories','Laughter','Dreams'].map(m=> <option key={m} value={m}>{m}</option>)}
                </select>
                <select className="select" value={palette} onChange={e=>setPalette(e.target.value)}>
                  {Object.keys(PALETTES).map(m=> <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <button className="btn-primary" onClick={start} disabled={loading}>Begin Session</button>
            </div>
          </div>
        )}

        {state?.started && (
          <div className="surface p-6">
            <div className="text-white/70 text-xs tracking-wide">ElinityAI — The Tower Architect</div>
            <div className="mt-2 whitespace-pre-wrap">{q?.prompt || 'What memory deserves a tower floor today?'}</div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {state?.players?.map(name=> (
                <div key={name} className="space-y-1">
                  <div className="text-white/70 text-xs">{name}</div>
                  <input className="input" placeholder="Short answer or quote" value={answers[name]||''} onChange={e=>setAnswers({...answers,[name]:e.target.value})} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={submit} disabled={loading}>🪄 Submit Answers</button>
              <button className="btn" onClick={nextLayer} disabled={loading}>🧱 Add Next Layer</button>
            </div>
          </div>
        )}

        {error && (
          <div className="surface p-3 text-sm text-red-300 border-red-500/30">{error}</div>
        )}
      </div>

      <aside className="space-y-3">
        <div className="surface p-4">
          <div className="text-white/70 text-xs tracking-wide">Tower Visualization</div>
          <div className="mt-3 flex flex-col gap-2">
            {tower.map((layer,i)=> (
              <div key={i} className="block animate-float" style={{background: layer.color, animationDelay: (i*0.1)+'s'}}>
                <div className="blockLabel px-2 py-1">{layer.label} — <span className="text-white/60">{layer.names?.join(', ')}</span></div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

const MOOD_COLORS = {
  Calm: '#79b8ff',
  Curious: '#b889f4',
  Gratitude: '#ffd38a',
  Joy: '#ffe27a',
  Melancholy: '#8aa1b1',
  Reflection: '#cbb7ff'
};

export default function Journey(){
  const router = useRouter();
  const { sessionId } = router.query || {};
  const [state, setState] = useState(null);
  const [startMood, setStartMood] = useState('Calm');
  const [response, setResponse] = useState('');
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');

  const phases = state?.plan?.phases || [];
  const idx = state?.index || 0;
  const current = phases[idx-1] || null;

  const palette = useMemo(()=>{
    const list = (state?.plan?.phases||[]).map(p=>MOOD_COLORS[p.mood]||'#999');
    return list;
  },[state?.plan?.phases]);

  async function fetchState(){
    if(!sessionId) return;
    try{ const r = await fetch(`/api/state?sessionId=${encodeURIComponent(sessionId)}`); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); setError(''); }
    catch(e){ setError(String(e.message||e)); }
  }
  useEffect(()=>{ if(sessionId) fetchState(); },[sessionId]);

  async function start(){
    if(!sessionId) return;
    try{
      const r = await fetch('/api/start_journey',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, startMood }) });
      const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j);
    }catch(e){ setError(String(e.message||e)); }
  }

  async function next(){
    if(!sessionId) return;
    try{
      const r = await fetch('/api/next_mood',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) });
      const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j);
      setResponse('');
    }catch(e){ setError(String(e.message||e)); }
  }

  async function share(){
    if(!sessionId) return;
    try{
      const r = await fetch('/api/share_response',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, text: response }) });
      const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setResponse('');
    }catch(e){ setError(String(e.message||e)); }
  }

  function toggleSound(){ setPlaying(p=>!p); }

  return (
    <div className="space-y-6">
      {/* Top: Mood indicator + progress */}
      <div className="mood-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="badge">Current Mood: {current?.mood || '—'}</div>
            <div className="badge">Phase {Math.min(idx || 0, phases.length || 0)} / {phases.length || 0}</div>
            {state?.plan?.final?.mood && <div className="badge">Destination: {state.plan.final.mood}</div>}
          </div>
          <div className="flex items-center gap-2">
            <button className="btn" onClick={toggleSound}>{playing?'⏸️ Stop Ambient':'🎧 Play Ambient'}</button>
            <button className="btn" onClick={()=>router.push('/')}>🌀 Restart Journey</button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {palette.map((c,i)=> (
            <div key={i} className="progress-dot" style={{ background:c, boxShadow:`0 0 10px ${c}`, opacity: i < idx ? 1 : 0.5 }} />
          ))}
        </div>
      </div>

      {/* If not started: choose starting mood */}
      {!state?.started && (
        <div className="mood-surface p-6">
          <div className="text-white/70 text-xs tracking-wide">Choosing the Starting Mood</div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select className="select w-full md:w-auto" value={startMood} onChange={e=>setStartMood(e.target.value)}>
              {['Calm','Anxious','Excited','Melancholy','Curious'].map(m=> <option key={m} value={m}>{m}</option>)}
            </select>
            <button className="btn-primary" onClick={start}>▶️ Begin Journey</button>
          </div>
        </div>
      )}

      {/* Middle: Narrative & Task */}
      {current && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 mood-surface p-6">
            <div className="text-white/70 text-xs tracking-wide">Scene</div>
            <div className="mt-2 whitespace-pre-wrap">{current.scene}</div>
            <div className="mt-2 text-white/70">🎶 Sound: {current.sound}</div>
          </div>
          <div className="mood-surface p-6">
            <div className="text-white/70 text-xs tracking-wide">Task / Reflection</div>
            <div className="mt-2">{current.task}</div>
            <div className="mt-3 flex items-center gap-2">
              <input className="input" placeholder="Share one color, word, or breath..." value={response} onChange={e=>setResponse(e.target.value)} />
              <button className="btn" onClick={share}>🗣️ Share</button>
            </div>
            <div className="mt-3">
              <button className="btn-primary" onClick={next}>▶️ Next Mood</button>
            </div>
          </div>
        </div>
      )}

      {/* End state */}
      {state?.finished && (
        <div className="mood-surface p-6">
          <div className="text-white/70 text-xs tracking-wide">Final State</div>
          <div className="mt-2">{state?.plan?.final?.aura || 'You have arrived.'}</div>
        </div>
      )}

      {error && (
        <div className="mood-surface p-3 text-sm text-red-300 border-red-500/30">{error}</div>
      )}
    </div>
  );
}

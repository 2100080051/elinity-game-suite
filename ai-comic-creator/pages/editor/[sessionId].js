import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Editor(){
  const router = useRouter();
  const { sessionId } = router.query || {};
  const [state, setState] = useState(null);
  const [theme, setTheme] = useState('Aliens opening a bakery');
  const [style, setStyle] = useState('Anime');
  const [panels, setPanels] = useState(5);
  const [tone, setTone] = useState('Funny');
  const [dialogue, setDialogue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchState(){
    if(!sessionId) return;
    try{ const r = await fetch(`/api/state?sessionId=${encodeURIComponent(sessionId)}`); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); setError(''); }
    catch(e){ setError(String(e.message||e)); }
  }
  useEffect(()=>{ if(sessionId) fetchState(); },[sessionId]);

  async function doSetup(){
    setLoading(true);
    try{
      const r = await fetch('/api/setup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, theme, style, panels, tone }) });
      const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j);
    }catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function generate(){
    setLoading(true);
    try{ const r = await fetch('/api/generate_panel', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); }
    catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function regenerate(){
    setLoading(true);
    try{ const r = await fetch('/api/regenerate_scene', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); }
    catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function addDialogue(){
    setLoading(true);
    try{ const r = await fetch('/api/add_dialogue', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, text: dialogue }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setDialogue(''); setState(j); }
    catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function save(){
    try{ const r = await fetch('/api/save_progress',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId })}); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); alert('Saved'); }catch(e){ setError(String(e.message||e)); }
  }

  async function finish(){
    setLoading(true);
    try{ const r = await fetch('/api/finish_comic',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId })}); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); router.push(`/final/${sessionId}`); }
    catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  const p = state?.current || {};
  const total = state?.setup?.panels || 0;
  const idx = state?.index || 0;
  const pct = total? Math.round((Math.min(idx,total)/total)*100) : 0;

  return (
    <div className="space-y-6">
      <div className="surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="badge">Title: {state?.title || '—'}</div>
            <div className="badge">Panel {Math.min(idx,total)} of {total}</div>
            {state?.setup && <div className="badge">{state.setup.style} · {state.setup.tone}</div>}
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="progress w-full md:w-64"><span style={{width: pct+'%'}} /></div>
          </div>
        </div>
      </div>

      {!state?.setup && (
        <div className="surface p-6">
          <div className="text-white/70 text-xs tracking-wide">Setup your comic</div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="input" placeholder="Theme/Concept" value={theme} onChange={e=>setTheme(e.target.value)} />
            <select className="select" value={style} onChange={e=>setStyle(e.target.value)}>
              {['Anime','Retro','Noir','Pixel','Watercolor'].map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="number" min={4} max={8} className="input" placeholder="Panels" value={panels} onChange={e=>setPanels(Number(e.target.value||6))} />
            <select className="select" value={tone} onChange={e=>setTone(e.target.value)}>
              {['Funny','Dramatic','Wholesome','Dark'].map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="mt-3">
            <button className="btn-primary" onClick={doSetup} disabled={loading}>Confirm & Create Title</button>
          </div>
        </div>
      )}

      {state?.setup && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 surface p-6">
            <h2 className="panel-title">Panel Preview</h2>
            <div className="panel-canvas mt-3">
              <div>{p.scene ? p.scene : 'Your panel will appear here.'}</div>
            </div>
            <div className="mt-3 text-white/70">Camera: {p.camera || '—'} · Mood: {p.mood || '—'}</div>
            <div className="mt-1 text-white/50 text-sm">{p.notes ? `Notes: ${p.notes}` : ''}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={generate} disabled={loading}>🎨 Generate Next Panel</button>
              <button className="btn" onClick={regenerate} disabled={loading}>💭 Regenerate Scene</button>
            </div>
          </div>
          <div className="surface p-6">
            <div className="text-white/70 text-xs tracking-wide">Dialogue & FX</div>
            <div className="mt-2 flex items-center gap-2">
              <input className="input" placeholder="Add dialogue / caption / SFX" value={dialogue} onChange={e=>setDialogue(e.target.value)} />
              <button className="btn" onClick={addDialogue} disabled={!dialogue.trim()}>🗨️ Add</button>
            </div>
            <div className="mt-3 text-sm text-white/80 space-y-1">
              {(state?.dialogues||[]).slice(-5).map((d,i)=> <div key={i}>• {d.text}</div>)}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-2">
              <button className="btn" onClick={save}>💾 Save Progress</button>
              <button className="btn" onClick={finish} disabled={idx < total}>🏁 Finish Comic</button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="surface p-3 text-sm text-red-300 border-red-500/30">{error}</div>
      )}
    </div>
  );
}

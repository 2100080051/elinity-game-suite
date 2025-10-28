import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

function useQuery(){
  const router = useRouter();
  return useMemo(()=>{
    const q = Object.create(null); if(!router?.asPath) return q;
    const idx = router.asPath.indexOf('?'); if(idx===-1) return q;
    const sp = new URLSearchParams(router.asPath.slice(idx+1)); sp.forEach((v,k)=>q[k]=v); return q;
  },[router?.asPath]);
}

export default function Chapter(){
  const router = useRouter();
  const { sessionId } = router.query || {};
  const [state, setState] = useState(null);
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchState(){
    if(!sessionId) return;
    try{ const r = await fetch(`/api/state?sessionId=${encodeURIComponent(sessionId)}`); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); setError(''); }
    catch(e){ setError(String(e.message||e)); }
  }
  useEffect(()=>{ if(!sessionId) return; fetchState(); },[sessionId]);

  async function startChapter(){
    if(!sessionId) return; setLoading(true);
    try{ const r = await fetch('/api/start_chapter', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); }
    catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function showHint(){
    if(!sessionId) return; try{ const r = await fetch('/api/show_hint', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setHint(j.hint||''); fetchState(); }catch(e){ setError(String(e.message||e)); }
  }

  async function submit(){
    if(!sessionId) return; setLoading(true);
    try{ const r = await fetch('/api/submit_answer', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, answer }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setAnswer(''); setHint(''); setState(j.state); }
    catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function skip(){
    if(!sessionId) return; try{ const r = await fetch('/api/skip_puzzle', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); setHint(''); setAnswer(''); }catch(e){ setError(String(e.message||e)); }
  }

  const progressText = state ? `Puzzle ${Math.min(state.index||0, state.total||3)} of ${state.total||3}` : '';
  const c = state?.current;
  const isChoice = Array.isArray(c?.choices) && c.choices.length > 0;

  async function save(){
    if(!sessionId) return;
    try{
      const r = await fetch('/api/save_progress',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId })});
      const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed');
      try{ localStorage.setItem('puzzleSaga:lastSession', sessionId); }catch{}
      alert('Progress saved');
    }catch(e){ setError(String(e.message||e)); }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="panel p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="badge">Chapter {state?.chapter||'-'}</div>
            {state?.title && <div className="badge">{state.title}</div>}
            {progressText && <div className="badge">{progressText}</div>}
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-primary" onClick={startChapter} disabled={loading}>Begin / Restart Chapter</button>
          </div>
        </div>

        <div className="panel p-4 space-y-3">
          <div className="narration">{state?.narration || 'Prologue: The Puzzle Master awaits. Begin the chapter to step into the labyrinth.'}</div>
          {state?.setting && <div className="text-white/70 text-sm">Setting: {state.setting}</div>}
        </div>

        {c && (
          <div className="panel p-4 space-y-3">
            <div className="section-title">Puzzle</div>
            <div className="text-white/90">{c.question}</div>
            {isChoice ? (
              <div className="flex gap-2 mt-2 flex-wrap">
                {c.choices.map(opt => (
                  <button key={opt} className={`btn ${answer===opt?'bg-white/10':''}`} onClick={()=>setAnswer(opt)}>{opt}</button>
                ))}
              </div>
            ) : (
              <input className="input mt-2" placeholder="Type your answer" value={answer} onChange={e=>setAnswer(e.target.value)} />
            )}
            {hint && (
              <div className="text-cyanGlow mt-2">Hint: {hint}</div>
            )}
          </div>
        )}

        {error && (
          <div className="panel p-3 text-sm text-red-300 border-red-500/30">{error}</div>
        )}
      </div>

      <aside className="right-rail">
        <div className="panel p-4 space-y-2">
          <div className="section-title">Your Saga</div>
          <div className="flex flex-wrap gap-2">
            <div className="kpi">Chapter: <span className="text-cyanGlow ml-1">{state?.chapter||'-'}</span></div>
            <div className="kpi">Progress: <span className="text-cyanGlow ml-1">{progressText||'-'}</span></div>
          </div>
        </div>

        <div className="panel p-4 space-y-2">
          <div className="section-title">Actions</div>
          <div className="grid grid-cols-1 gap-2">
            <button className="btn-primary" onClick={submit} disabled={!answer.trim()}>✅ Submit Answer</button>
            <button className="btn" onClick={showHint}>💡 Show Hint</button>
            <button className="btn" onClick={skip}>⏭️ Skip Puzzle</button>
            <button className="btn" onClick={save}>💾 Save Progress</button>
          </div>
        </div>
      </aside>
    </div>
  );
}

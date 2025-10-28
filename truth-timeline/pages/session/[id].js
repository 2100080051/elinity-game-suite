import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';

function useQuery(){
  const router = useRouter();
  return useMemo(()=>{
    const q = Object.create(null); if(!router?.asPath) return q;
    const idx = router.asPath.indexOf('?'); if(idx===-1) return q;
    const sp = new URLSearchParams(router.asPath.slice(idx+1)); sp.forEach((v,k)=>q[k]=v); return q;
  },[router?.asPath]);
}

export default function Session(){
  const router = useRouter();
  const { id: sessionId } = router.query || {};
  const query = useQuery();
  const [playerId, setPlayerId] = useState(query.playerId || '');
  const [name, setName] = useState('');

  const [state, setState] = useState(null);
  const [year, setYear] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snapshot, setSnapshot] = useState(null);
  const [reflection, setReflection] = useState(null);
  const [mood, setMood] = useState('');

  async function fetchState(){
    if(!sessionId) return;
    try{
      const r = await fetch(`/api/state?sessionId=${encodeURIComponent(sessionId)}`);
      const d = await r.json(); if(!r.ok) throw new Error(d?.error||'Failed');
      setState(d); setError('');
    }catch(e){ setError(String(e.message||e)); }
  }

  useEffect(()=>{ if(!sessionId) return; fetchState(); const id = setInterval(fetchState, 1500); return ()=>clearInterval(id); },[sessionId]);

  async function ensureJoined(){
    if(playerId || !sessionId) return; if(!name.trim()) return; setLoading(true);
    try{
      const r = await fetch('/api/join', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, name: name.trim() || 'Traveler' }) });
      const d = await r.json(); if(!r.ok) throw new Error(d?.error||'Join failed');
      setPlayerId(d.playerId);
      router.replace({ pathname: router.pathname, query: { id: sessionId, playerId: d.playerId } }, undefined, { shallow: true });
    }catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function getPrompt(zone){
    if(!sessionId) return; setLoading(true);
    try{
      const r = await fetch('/api/next_prompt', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, zone }) });
      const d = await r.json(); if(!r.ok) throw new Error(d?.error||'Failed'); setState(d);
    }catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function submit(){
    if(!sessionId || !playerId) return;
    const entry = { zone: state?.currentPrompt?.zone || 'present', year, content };
    setLoading(true);
    try{
      const r = await fetch('/api/submit_entry', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, playerId, entry }) });
      const d = await r.json(); if(!r.ok || !d.ok) throw new Error(d?.error||'Submit failed');
      setYear(''); setContent(''); fetchState();
    }catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function makeSnapshot(){
    if(!sessionId) return; setLoading(true);
    try{
      const r = await fetch('/api/snapshot', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) });
      const d = await r.json(); if(!r.ok) throw new Error(d?.error||'Failed'); setSnapshot(d);
    }catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function makeReflection(){
    if(!sessionId) return; setLoading(true);
    try{
      const r = await fetch('/api/reflect', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) });
      const d = await r.json(); if(!r.ok) throw new Error(d?.error||'Failed'); setReflection(d);
    }catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function saveTitle(){
    const title = prompt('Name your timeline', state?.title || 'Untitled Timeline');
    if(!title) return;
    try{
      const r = await fetch('/api/save_title', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, title }) });
      const d = await r.json(); if(!r.ok) throw new Error(d?.error||'Failed'); setState(d);
    }catch(e){ setError(String(e.message||e)); }
  }

  async function chooseMood(m){
    if(!sessionId || !playerId) return;
    try{
      const r = await fetch('/api/choose_mood', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, playerId, mood: m }) });
      const d = await r.json(); if(!r.ok) throw new Error(d?.error||'Failed');
      setMood(m); setState(d);
    }catch(e){ setError(String(e.message||e)); }
  }

  async function nextPhase(){
    if(!sessionId) return; setLoading(true);
    try{
      const r = await fetch('/api/next_phase', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) });
      const d = await r.json(); if(!r.ok) throw new Error(d?.error||'Failed'); setState(d);
    }catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="badge">Session</div>
          <div className="text-lg font-semibold select-all">{sessionId}</div>
          {state?.currentPrompt?.zone && <div className="badge">{state.currentPrompt.zone.toUpperCase()}</div>}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={()=>getPrompt()}>🔄 New Prompt</button>
          <button className="btn" onClick={saveTitle}>💾 Save Title</button>
        </div>
      </div>

      {/* Join fallback */}
      {!playerId && (
        <div className="panel p-4 flex items-center gap-3">
          <div className="text-white/80">Enter a name to join this session:</div>
          <input className="input w-64" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" />
          <button className="btn-primary" onClick={ensureJoined} disabled={!name.trim()}>Join</button>
        </div>
      )}

      {/* Phase Indicator */}
      <div className="panel p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="badge">Phase</div>
          <div className="uppercase tracking-wider text-white/80">{state?.phase || 'awakening'}</div>
          {state?.connection?.shared_theme && (
            <div className="badge">Shared Theme: {state.connection.shared_theme}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={nextPhase}>Next Phase ➡️</button>
        </div>
      </div>

      {/* Timeline + Chat */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Timeline Canvas */}
        <div className="md:col-span-2 space-y-3">
          <div className="panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white/70 text-sm">Timeline: <span className="font-serif text-white">{state?.title || 'Untitled Timeline'}</span></div>
              <div className="text-white/50 text-xs">Past • Present • Future</div>
            </div>
            <div className="space-y-3">
              {(state?.entries||[]).map(e=> {
                const pmood = (state?.moods||[]).find(m=>m.playerId===e.playerId)?.mood || '';
                const moodClass = pmood ? `mood-${pmood}` : '';
                return (
                <div key={e.id} className={`timeline-node animate-fadein ${e.zone==='past'?'zone-past': e.zone==='present'?'zone-present':'zone-future'} ${moodClass}`}>
                  <div className="text-white/60 text-xs flex items-center gap-2">
                    <span>{e.year || (e.zone==='past'?'Once upon a time': e.zone==='future'?'Someday':'Now')}</span>
                    <span>•</span>
                    <span>{e.playerName}</span>
                    <span className="badge capitalize">{e.zone}{pmood?` • ${pmood}`:''}</span>
                  </div>
                  <div className="mt-1 text-white/90">{e.ai_summary || e.content}</div>
                  <details className="text-white/60 text-sm mt-1">
                    <summary className="cursor-pointer">Show full entry</summary>
                    <div className="mt-1 whitespace-pre-wrap">{e.content}</div>
                  </details>
                </div>
              );})}
              {(!state?.entries || state.entries.length===0) && (
                <div className="text-white/50 text-sm">No entries yet. Ask the curator for a prompt and add your first memory.</div>
              )}
            </div>
          </div>

          {/* Reflection Panel */}
          <div className="panel p-4">
            <div className="flex items-center justify-between">
              <div className="text-white/70 text-sm">Reflection</div>
              <button className="btn" onClick={makeReflection}>🪞 Generate Insight</button>
            </div>
            {reflection ? (
              <div className="mt-2 space-y-1">
                <div className="italic">“{reflection.insight}”</div>
                <div className="text-white/80">{reflection.question}</div>
              </div>
            ) : (
              <div className="text-white/50 text-sm mt-2">Insights appear after you add a few memories.</div>
            )}
          </div>
        </div>

        {/* Chat & Prompt Zone */}
        <div className="space-y-3">
          <div className="panel p-4">
            <div className="text-white/70 text-sm">Time Weaver</div>
            {state?.phase==='awakening' ? (
              <div className="mt-2 space-y-2">
                <p className="font-serif text-lg">{state?.currentPrompt?.welcome || 'Welcome to the Time Loom.'}</p>
                <div className="text-white/70 text-sm">{state?.currentPrompt?.instruction || 'Choose your mood color.'}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['serenity','passion','growth','mystery'].map(m=> (
                    <button key={m} className={`btn ${m===mood?'ring-2 ring-white/30':''}`} onClick={()=>chooseMood(m)} disabled={!playerId}>{m[0].toUpperCase()+m.slice(1)}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-2">
                {state?.currentPrompt?.zone && <div className="badge capitalize">{state.currentPrompt.zone}</div>}
                <p className="mt-2 font-serif text-lg">{state?.currentPrompt?.prompt || 'Continue your thread.'}</p>
                {state?.connection?.synthesis && (
                  <div className="mt-3 text-white/80 italic">{state.connection.synthesis}</div>
                )}
              </div>
            )}
            {state?.phase!=='awakening' && (
              <div className="mt-3 space-y-2">
                <input className="input" value={year} onChange={e=>setYear(e.target.value)} placeholder="Year or label (optional)" />
                <textarea className="input min-h-[120px]" value={content} onChange={e=>setContent(e.target.value)} placeholder={state?.phase==='present'?'Share the emotion or scene that defines now…': state?.phase==='future'?'Describe a vision or horizon…':'Share a memory…'} />
                <button className="btn-primary" onClick={submit} disabled={!playerId || !content.trim()}>➕ Add Node</button>
              </div>
            )}
          </div>

          <div className="panel p-4">
            <div className="flex items-center justify-between">
              <div className="text-white/70 text-sm">Timeline Snapshot</div>
              <button className="btn" onClick={makeSnapshot}>📜 Generate</button>
            </div>
            {snapshot ? (
              <div className="mt-2 space-y-2">
                <div className="font-serif text-lg">✨ {snapshot.title}</div>
                <div className="space-y-1 text-white/80">
                  {snapshot.lines.map((ln,i)=> <div key={i}>• {ln}</div>)}
                </div>
                <div className="text-white/80 italic">{snapshot.summary}</div>
              </div>
            ) : (
              <div className="text-white/50 text-sm mt-2">The curator will weave a snapshot from your latest entries.</div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="panel p-3 text-sm text-red-300 border-red-500/30">{error}</div>
      )}
    </div>
  );
}

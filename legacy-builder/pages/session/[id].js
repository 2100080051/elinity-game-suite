import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';

export default function Session(){
  const router = useRouter();
  const { id } = router.query;
  const [state, setState] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const dingedGen = useRef(0);

  async function load(){
    if (!id) return;
    const res = await fetch(`/api/state?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    setState(data);
  }
  useEffect(()=>{ load(); const t=setInterval(load, 4000); return ()=>clearInterval(t); }, [id]);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); }, [state?.history?.length, state?.packet]);

  async function next(){
    setLoading(true);
    await fetch('/api/next_prompt', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    setLoading(false); load();
  }

  async function reflect(){
    if (!note.trim()) return;
    await fetch('/api/journal', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, text: note }) });
    setNote(''); load();
  }

  async function finalize(){
    setLoading(true);
    await fetch('/api/finalize_generation', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    setLoading(false); load();
  }

  useEffect(()=>{
    // Subtle harp-like ding when a new packet arrives
    if (state?.packet && (state.generation||0)!== dingedGen.current){
      try{
        const ctx = new (window.AudioContext||window.webkitAudioContext)();
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type='sine'; o.frequency.setValueAtTime(660, ctx.currentTime);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime+0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.6);
        o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime+0.65);
      }catch{}
      dingedGen.current = state.generation||0;
    }
  },[state?.packet, state?.generation]);

  const title = useMemo(()=> state?.packet?.ui_title || `🏛️ LEGACY BUILDER — Generation ${state?.generation||1}`, [state]);

  if (!state) return <div className="text-white/70">Summoning the Storykeeper…</div>;

  const p = state.packet || {};
  const header = `${state.name} — Generation ${state.generation}`;

  return (
    <div className="space-y-6">
      <div className="panel p-4">
        <div className="text-white/70 text-sm">{header}</div>
        <h2 className="text-2xl font-cinzel mt-1">{title}</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-3">
          <div className="scrollbox">
            <div className="text-white/70 text-sm">Era</div>
            <div className="text-white/90 text-lg">{p.era || 'Click Next Prompt to begin this generation.'}</div>
            <div className="mt-3 text-white/70 text-sm">Heir</div>
            <div className="text-white/90">{p.heir || '-'}</div>
            <div className="mt-3 text-white/70 text-sm">Central Conflict</div>
            <div className="text-white/90">{p.conflict || '-'}</div>
            <div ref={endRef} />
          </div>
          <div className="scrollbox">
            <div className="text-white/70 text-sm">Artifacts</div>
            <div className="space-y-2 mt-1">
              {(p.artifacts||[]).map((a,i)=> (<div key={i} className="artifact">{a}</div>))}
              {(!p.artifacts || p.artifacts.length===0) && <div className="text-white/60 text-sm">Artifacts will appear here.</div>}
            </div>
            <div className="mt-3 text-white/70 text-sm">Lesson</div>
            <div className="text-white/90">{p.lesson || '-'}</div>
          </div>
        </div>
      </div>

      <div className="panel p-4">
        <div className="text-white/70 text-sm">Reflection</div>
        <div className="text-white/85 mt-1">{p.reflection || 'What does this generation teach the next?'}</div>
        <div className="mt-3 flex gap-2">
          <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Your thoughts or decisions…" className="input" />
          <button className="btn" onClick={reflect}>Add to Journal</button>
        </div>
        <div className="mt-3 text-white/70 text-sm">Journal</div>
        <div className="scrollbox mt-1">
          {state.journal.map((j,i)=> (<div key={i} className="artifact">{j.text}</div>))}
          {state.journal.length===0 && <div className="text-white/60 text-sm">No entries yet.</div>}
        </div>
      </div>

      <div className="panel p-4 flex flex-wrap gap-3 justify-between items-center">
        <div className="text-white/70 text-sm">Storykeeper Controls</div>
        <div className="flex gap-3">
          <button className="btn" disabled={loading} onClick={next}>Next Prompt</button>
          <button className="btn-primary" disabled={loading || !state.packet} onClick={finalize}>Finalize Generation</button>
        </div>
      </div>

      <div className="panel p-4">
        <div className="text-white/70 text-sm mb-2">Legacy Log</div>
        <div className="grid md:grid-cols-3 gap-3">
          {state.history.map((h,i)=> (
            <div key={i} className="artifact">
              <div className="font-semibold">Gen {h.generation} — {h.era}</div>
              <div className="text-white/70 text-sm">Heir: {h.heir}</div>
              <div className="text-white/70 text-sm">Conflict: {h.conflict}</div>
            </div>
          ))}
          {state.history.length===0 && <div className="text-white/60 text-sm">No previous generations yet.</div>}
        </div>
      </div>
    </div>
  );
}

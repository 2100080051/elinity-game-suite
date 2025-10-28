import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Final(){
  const router = useRouter();
  const { sessionId } = router.query || {};
  const [state, setState] = useState(null);

  async function fetchState(){
    if(!sessionId) return;
    try{ const r = await fetch(`/api/state?sessionId=${encodeURIComponent(sessionId)}`); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); }
    catch(e){ alert(String(e.message||e)); }
  }
  useEffect(()=>{ if(sessionId) fetchState(); },[sessionId]);

  const panels = state?.panels || [];

  return (
    <div className="space-y-6">
      <div className="surface p-6">
        <div className="text-white/70 text-xs tracking-wide">Final Comic</div>
        <h2 className="panel-title mt-1">{state?.title || 'Untitled Issue'}</h2>
        <div className="text-white/60 text-sm">Created by You & Elinity</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {panels.map((p,i)=> (
          <div key={i} className="surface p-4">
            <div className="text-white/70 text-xs">Panel {i+1}</div>
            <div className="panel-canvas mt-2">{p.scene||'—'}</div>
            <div className="mt-2 text-sm text-white/80">{(p.dialogues||[]).map((d,j)=> <div key={j}>• {d.text}</div>)}</div>
          </div>
        ))}
      </div>
      <div className="surface p-4 flex flex-wrap items-center gap-2">
        <button className="btn" onClick={()=>alert('Export PNG coming soon')}>💾 Save as PNG</button>
        <button className="btn" onClick={()=>alert('Export PDF coming soon')}>📄 Save as PDF</button>
        <button className="btn-primary" onClick={()=>router.push('/')}>🔁 Start Sequel Issue</button>
      </div>
    </div>
  );
}

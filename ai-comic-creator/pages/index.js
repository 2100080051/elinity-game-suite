import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Home(){
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start(){
    setLoading(true);
    try{
      const r = await fetch('/api/create_session', { method:'POST' });
      const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed');
      try{ localStorage.setItem('comic:lastSession', j.sessionId); }catch{}
      router.push(`/editor/${j.sessionId}`);
    }catch(e){ alert(e.message||String(e)); } finally{ setLoading(false); }
  }

  function myComics(){ router.push('/editor/library'); }
  function styles(){ router.push('/editor/styles'); }

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="md:col-span-2 surface p-8" style={{backgroundImage:'radial-gradient(circle at 20% 10%, rgba(42,164,255,0.1), transparent 50%), radial-gradient(circle at 80% 90%, rgba(255,61,166,0.1), transparent 50%)'}}>
          <h1 className="title">AI Comic Creator</h1>
          <div className="mt-2 text-white/80">Draw. Write. Laugh. Together.</div>
          <p className="mt-4 text-white/80 max-w-2xl">
            Co-create a comic with Elinity — your ideas and humor, brought to life as cinematic panels with witty pacing and continuity.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={start} disabled={loading}>🎬 Start New Comic</button>
            <button className="btn" onClick={myComics}>📚 My Comics</button>
            <button className="btn" onClick={styles}>🎨 Art Style Settings</button>
          </div>
        </div>
        <div className="surface p-6">
          <div className="text-white/70 text-xs tracking-wide">Preferences</div>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <button className="btn" onClick={()=>{}}>⚙️ Story Memory</button>
          </div>
        </div>
      </section>
    </div>
  );
}

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
      try{ localStorage.setItem('moodJourney:lastSession', j.sessionId); }catch{}
      router.push(`/journey/${j.sessionId}`);
    }catch(e){ alert(e.message||String(e)); } finally{ setLoading(false); }
  }

  function continueJourney(){
    start(); // Placeholder: starting new until real resume exists
  }

  function viewMap(){
    const id = localStorage.getItem('moodJourney:lastSession');
    if(id) router.push(`/journey/${id}?view=map`); else alert('No saved journey yet');
  }

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="md:col-span-2 mood-surface p-8 flex flex-col justify-center bg-breathe">
          <h1 className="title">Mood Journey</h1>
          <div className="mt-2 text-white/80">“Flow through feelings with ElinityAI.”</div>
          <p className="mt-4 text-white/80 max-w-2xl">
            Drift through evolving moods guided by ElinityAI — soft scenes, ambient sounds, and gentle reflections that paint your personal Mood Map.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={start} disabled={loading}>🌈 Start Journey</button>
            <button className="btn" onClick={continueJourney} disabled={loading}>🎧 Continue Mood Path</button>
            <button className="btn" onClick={viewMap}>🖼️ View Mood Map</button>
          </div>
        </div>
        <div className="mood-surface p-6">
          <div className="text-white/70 text-xs tracking-wide">Settings</div>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <button className="btn" onClick={()=>{}}>⚙️ Sound & Tone</button>
            <button className="btn" onClick={()=>{}}>🎨 Color Mode</button>
          </div>
        </div>
      </section>
    </div>
  );
}

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function Home(){
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // simple local resume support
  useEffect(()=>{
    const last = localStorage.getItem('puzzleSaga:lastSession');
    if(!last) return;
  },[]);

  async function startNew(){
    setLoading(true);
    try{
      const r = await fetch('/api/create_session', { method:'POST' });
      const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed');
      try{ localStorage.setItem('puzzleSaga:lastSession', j.sessionId); }catch{}
      router.push(`/chapter/${j.sessionId}`);
    }catch(e){ alert(e.message||String(e)); } finally{ setLoading(false); }
  }

  async function continueSaga(){
    // For now, create new until we add a true resume endpoint
    await startNew();
  }

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="md:col-span-2 panel p-8 flex flex-col justify-center">
          <h1 className="title">Elinity Puzzle Saga</h1>
          <div className="mt-2 text-amberNarr/90">The Mind’s Labyrinth</div>
          <p className="mt-4 text-white/80 max-w-2xl">
            Step into a cinematic journey of logic, words, and perception. Every correct answer advances the story. Every hint shapes your path.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={continueSaga} disabled={loading}>🧩 Continue Saga</button>
            <button className="btn" onClick={startNew} disabled={loading}>🌌 Start New Journey</button>
          </div>
        </div>
        <div className="panel p-6 right-rail">
          <div className="section-title">Quick Links</div>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <button className="btn" onClick={()=>router.push('#about')}>� About</button>
            <button className="btn" onClick={()=>router.push('#how')}>🧠 How it Works</button>
            <button className="btn" onClick={()=>router.push('#tips')}>💡 Tips</button>
          </div>
        </div>
      </section>

      <section id="about" className="panel p-6">
        <div className="section-title">About</div>
        <p className="mt-2 text-white/80">
          Guided by elinity AI, each chapter unfolds with atmospheric narration and evolving challenges. Your choices and performance influence the tone and difficulty.
        </p>
      </section>

      <section id="how" className="panel p-6">
        <div className="section-title">How it Works</div>
        <ul className="mt-3 list-disc list-inside text-white/80 space-y-1">
          <li>Begin a chapter to receive an intro and three puzzles.</li>
          <li>Submit answers or request hints as needed.</li>
          <li>Advance to the next chapter as you solve puzzles.</li>
        </ul>
      </section>

      <section id="tips" className="panel p-6">
        <div className="section-title">Tips</div>
        <ul className="mt-3 list-disc list-inside text-white/80 space-y-1">
          <li>Try to reason aloud — patterns reveal themselves.</li>
          <li>Use hints sparingly; they affect tone and pacing.</li>
          <li>Enjoy the story — the labyrinth listens.</li>
        </ul>
      </section>
    </div>
  );
}

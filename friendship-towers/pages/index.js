import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Home(){
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function startNew(){
    setLoading(true);
    try{ const r = await fetch('/api/create_session', { method:'POST' }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); localStorage.setItem('friendship:last', j.sessionId); router.push(`/tower/${j.sessionId}`);}catch(e){ alert(e.message||String(e)); } finally{ setLoading(false); }
  }

  function continueTower(){ const id = localStorage.getItem('friendship:last'); if(id) router.push(`/tower/${id}`); else startNew(); }

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="md:col-span-2 surface p-8 sky">
          <h1 className="title">🏰 Friendship Towers</h1>
          <div className="mt-2 sub">“Every memory is a brick of light.”</div>
          <p className="mt-4 text-white/80 max-w-2xl">Co-create a glowing digital tower from your shared memories, gratitude, and laughter — guided by Elinity, the Tower Architect.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={continueTower} disabled={loading}>🌅 Continue Tower</button>
            <button className="btn" onClick={startNew} disabled={loading}>🏗️ Start New Tower</button>
            <button className="btn" onClick={()=>alert('Memories page coming soon')}>📜 View Memories</button>
            <button className="btn" onClick={()=>alert('Settings coming soon')}>⚙️ Settings</button>
          </div>
        </div>
        <div className="surface p-6">
          <div className="text-white/70 text-xs tracking-wide">Preview</div>
          <div className="mt-3 flex items-end gap-2 h-48">
            {Array.from({length:8}).map((_,i)=> (
              <div key={i} className="flex flex-col items-center animate-float" style={{animationDelay: (i*0.2)+'s'}}>
                <div className="block" style={{width: 24 + (i%3)*6, background: i%2? 'linear-gradient(90deg, #ffc3a0, #c4b5fd)': 'linear-gradient(90deg, #a7f3d0, #ffdf80)'}} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

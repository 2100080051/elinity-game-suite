import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Home(){
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start(){
    setLoading(true);
    try{
      const r = await fetch('/api/create_session', { method:'POST' });
      const j = await r.json();
      if(!r.ok) throw new Error(j?.error||'Failed');
      router.push(`/summon/${j.sessionId}`);
    }catch(e){ alert(e.message||String(e)); } finally{ setLoading(false); }
  }

  async function random(){
    setLoading(true);
    try{
      const r = await fetch('/api/random_beast', { method:'POST' });
      const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed');
      router.push(`/summon/${j.sessionId}`);
    }catch(e){ alert(e.message||String(e)); } finally{ setLoading(false); }
  }

  async function viewCodex(){ router.push('/summon/codex'); }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
  <h1 className="title">🐉 Elinity Mythic Beast Builder</h1>
        <div className="sub">Forge legends from imagination.</div>
      </div>

      <div className="panel p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="btn-primary" onClick={start} disabled={loading}>⚡ Start Summoning</button>
          <button className="btn" onClick={viewCodex}>📖 View Mythic Codex</button>
          <button className="btn" onClick={random} disabled={loading}>🎨 Random Beast Mode</button>
          <div className="flex items-center gap-2">
            <span className="text-rune/80">🌍 Themes:</span>
            <span className="badge">Forest</span>
            <span className="badge">Sky</span>
            <span className="badge">Cosmic</span>
            <span className="badge">Abyss</span>
          </div>
        </div>
      </div>
    </div>
  );
}

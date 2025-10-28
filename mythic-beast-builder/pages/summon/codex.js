import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Codex(){
  const [codex, setCodex] = useState([]);
  const [error, setError] = useState('');
  useEffect(()=>{ (async()=>{ try{ const r = await fetch('/api/codex'); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setCodex(j.codex||[]); }catch(e){ setError(String(e.message||e)); } })(); },[]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
  <h1 className="title">📖 Elinity Mythic Codex</h1>
        <Link className="btn" href="/">Home</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {codex.map(e => (
          <div key={e.id} className="panel p-4 space-y-1">
            <div className="text-rune/70 text-sm">{e.theme} — Round {e.round}</div>
            <div className="text-rune/90 text-lg font-mystic">{e.name}</div>
            <div className="text-rune/80 line-clamp-3">{e.beast?.summary}</div>
            <div className="text-rune/70 text-sm">🧿 {e.beast?.rarity} • 🪶 {e.beast?.alignment}</div>
          </div>
        ))}
      </div>
      {error && <div className="panel p-3 text-sm text-red-300 border-red-500/30">{error}</div>}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Home(){
  const [legacies, setLegacies] = useState([]);
  const [name, setName] = useState('');
  const router = useRouter();

  async function load(){
    const res = await fetch('/api/list_legacies');
    const data = await res.json();
    setLegacies(data.legacies||[]);
  }
  useEffect(()=>{ load(); const t=setInterval(load,4000); return ()=>clearInterval(t); },[]);

  async function create(){
    if (!name.trim()) return;
    const res = await fetch('/api/new_legacy', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name }) });
    const data = await res.json();
    router.push(`/session/${data.id}`);
  }

  return (
    <div className="space-y-8">
      <section className="text-center">
        <div className="badge mb-2">Ancient Codex — Modern Elegance</div>
        <h1 className="text-4xl md:text-6xl font-cinzel">🏛️ Legacy Builder</h1>
        <p className="text-white/70 mt-2">Shape generations. Build myths. Leave a mark.</p>
        <div className="mt-5 flex flex-wrap gap-3 justify-center">
          <button className="btn-primary" onClick={create}>🌱 Begin New Legacy</button>
          <button className="btn" onClick={load}>📜 Continue Existing Legacy</button>
          <button className="btn" onClick={()=>router.push('/about')}>🕯️ About the Game</button>
        </div>
      </section>

      <div className="panel p-4">
        <div className="text-white/70 text-sm mb-2">Create a Legacy</div>
        <div className="flex gap-2">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Legacy name (e.g., Silver Rivers)" className="input" />
          <button className="btn-primary" onClick={create}>Create</button>
        </div>
      </div>

      <div className="panel p-4">
        <div className="text-white/70 text-sm mb-2">Saved Legacies</div>
        <div className="grid md:grid-cols-3 gap-3">
          {legacies.map(l => (
            <div key={l.id} className="artifact">
              <div className="font-semibold">{l.name}</div>
              <div className="text-white/70 text-sm">Generation {l.generation}</div>
              <div className="mt-2"><button className="btn-primary" onClick={()=>router.push(`/session/${l.id}`)}>Continue</button></div>
            </div>
          ))}
          {legacies.length===0 && <div className="text-white/60 text-sm">No legacies yet. Start one above.</div>}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';

export default function GroupPlay() {
  const [players, setPlayers] = useState([]);
  const [newName, setNewName] = useState('');
  const [turnIdx, setTurnIdx] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [responses, setResponses] = useState({}); // name -> text
  const [artifacts, setArtifacts] = useState([]);

  useEffect(()=>{ regenPrompt(); },[]);

  function addPlayer() {
    const name = newName.trim();
    if (!name) return;
    if (players.includes(name)) return;
    setPlayers([...players, name]);
    setNewName('');
  }

  async function regenPrompt() {
    try {
      const res = await fetch('/api/prompt', { method: 'POST' });
      if (!res.ok) { setCurrentPrompt(''); return; }
      const data = await res.json();
      setCurrentPrompt(data.prompt || '');
    } catch { setCurrentPrompt(''); }
  }

  async function submitForCurrent() {
    if (!players.length) return;
    const name = players[turnIdx % players.length];
    const response = (responses[name] || '').trim();
    if (!response) return;
    const res = await fetch('/api/artifacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response, prompt: currentPrompt, save: true })
    });
    if (res.ok) {
      const art = await res.json();
      setArtifacts([art, ...artifacts]);
      setTurnIdx((turnIdx + 1) % players.length);
    }
  }

  const currentName = players.length ? players[turnIdx % players.length] : null;

  return (
    <main className="pt-28">
      <section className="max-w-6xl mx-auto px-6">
        <div className="card p-6">
          <h1 className="text-2xl font-bold text-white/95">Group Play</h1>
          <p className="text-mist/80 mt-2">Add players, then each takes a turn responding to the prompt.</p>
          <div className="mt-4 flex gap-2">
            <input className="input" placeholder="Add player name" value={newName} onChange={e=>setNewName(e.target.value)} />
            <button className="btn" onClick={addPlayer}>Add</button>
          </div>
          {!!players.length && (
            <div className="mt-4 flex flex-wrap gap-2">{players.map(p=> <span key={p} className={`chip ${currentName===p?'bg-white/20':''}`}>{p}</span>)}</div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-white/90 font-semibold">Prompt</h2>
              <button className="chip" onClick={regenPrompt}>Regenerate</button>
            </div>
            <p className="mt-2 text-mist/90">{currentPrompt}</p>
          </div>
          <div className="card p-6">
            <h2 className="text-white/90 font-semibold">{currentName ? `${currentName}'s Response` : 'Add players to begin'}</h2>
            {currentName && (
              <>
                <textarea className="textarea mt-3" value={responses[currentName]||''} onChange={e=>setResponses({ ...responses, [currentName]: e.target.value })} />
                <div className="mt-3 text-right">
                  <button className="btn btn-primary" onClick={submitForCurrent}>Submit Turn</button>
                </div>
              </>
            )}
          </div>
        </div>

        {!!artifacts.length && (
          <div className="mt-6">
            <h3 className="text-white/90 font-semibold mb-3">Recent Artifacts</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {artifacts.map(a=> (
                <div className="card p-4" key={a.id}>
                  <div className="aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10 mb-3">
                    {a.imageUrl ? <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-mist/60">No image</div>}
                  </div>
                  <div className="text-sm uppercase tracking-wider text-mist/70">Artifact</div>
                  <div className="text-white/95 font-semibold">{a.title || a.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

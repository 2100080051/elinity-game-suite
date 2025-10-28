import { useEffect, useMemo, useState } from 'react';

export default function Play() {
  const [phase, setPhase] = useState('intro'); // intro|draft|round|climax|archive
  const [world, setWorld] = useState(null);
  const [characters, setCharacters] = useState([]); // {type:'HERO'|'VILLAIN'|'CREATURE', text, note}
  const [draft, setDraft] = useState({ type: 'HERO', text: '' });
  const [rounds, setRounds] = useState([]); // {round, text, votes}
  const [currentInput, setCurrentInput] = useState('');
  const [finale, setFinale] = useState(null); // {climax, moral}
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!world) startWorld(); }, []);

  async function startWorld() {
    try {
      const res = await fetch('/api/world', { method: 'POST' });
      const data = await res.json();
      setWorld(data);
    } catch {
      setWorld({
        name: 'Lyrion', theme: 'Eternal Twilight',
        intro: 'Welcome, brave storytellers! I open the gate to Lyrion, where day and night never meet, and a quiet war hums beneath the horizon.',
      });
    }
  }

  async function addCharacter() {
    if (!draft.text.trim()) return;
    const payload = { type: draft.type, text: draft.text.trim(), world };
    const res = await fetch('/api/character', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setCharacters([...characters, data]);
    setDraft({ ...draft, text: '' });
    if (phase === 'intro') setPhase('draft');
  }

  async function nextRound() {
    const payload = { world, characters, rounds, player: currentInput.trim() };
    const res = await fetch('/api/round', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setRounds([...rounds, { round: rounds.length + 1, text: data.text, votes: 0 }]);
    setCurrentInput('');
    setPhase('round');
  }

  async function finalize() {
    const payload = { world, characters, rounds };
    const res = await fetch('/api/climax', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setFinale(data);
    setPhase('climax');
  }

  async function saveLegend() {
    if (!finale) return;
    setSaving(true);
    const payload = {
      title: dataTitle(world, characters),
      world: world?.name || 'Unknown',
      authors: [],
      characters: characters.map(c=> `${c.type}: ${c.text}`),
      rounds,
      climax: finale.climax,
      moral: finale.moral,
    };
    const res = await fetch('/api/archive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const saved = await res.json();
    try {
      const key = 'myth:legends';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.unshift(saved);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch {}
    setSaving(false);
    window.location.href = '/book';
  }

  return (
    <main className="pt-28">
      <section className="max-w-6xl mx-auto px-6">
        {/* World Intro */}
        <div className="panel p-6">
          <h1 className="text-2xl font-bold text-ink">World: {world?.name || '...'}</h1>
          <p className="subtle">Theme: {world?.theme || '...'}</p>
          <p className="mt-3 text-ink/80 whitespace-pre-wrap">{world?.intro || 'Summoning realm...'}</p>
          <div className="mt-3 text-right">
            <button className="btn" onClick={()=> setPhase('draft')}>Next</button>
          </div>
        </div>

        {/* Character Draft */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="panel p-6">
            <h2 className="text-ink font-semibold">Character Draft</h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <select className="input" value={draft.type} onChange={e=> setDraft({ ...draft, type: e.target.value })}>
                <option>HERO</option>
                <option>VILLAIN</option>
                <option>CREATURE</option>
              </select>
              <input className="col-span-2 input" placeholder="Name or trait..." value={draft.text} onChange={e=> setDraft({ ...draft, text: e.target.value })} />
            </div>
            <div className="mt-3 text-right">
              <button className="btn btn-ember" onClick={addCharacter}>Add</button>
            </div>
            {!!characters.length && (
              <div className="mt-4">
                <h3 className="text-sm uppercase tracking-wider text-slate/80">Chosen Entities</h3>
                <ul className="mt-2 space-y-2">
                  {characters.map((c, i)=> (
                    <li key={i} className="flex items-start gap-3">
                      <span className="tab">{iconFor(c.type)} {c.type}</span>
                      <div>
                        <div className="text-ink">{c.text}</div>
                        <div className="text-slate/80 text-sm">{c.note}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Story Rounds Panel */}
          <div className="panel p-6">
            <h2 className="text-ink font-semibold">Story Rounds</h2>
            <p className="text-slate/80 text-sm">After each addition, advance the tale.</p>
            <div className="mt-3">
              <textarea className="textarea" placeholder="Add a sentence or decision..." value={currentInput} onChange={e=> setCurrentInput(e.target.value)} />
              <div className="mt-3 flex items-center justify-between">
                <button className="btn btn-ink" onClick={nextRound}>Play</button>
                <button className="btn" onClick={finalize} disabled={rounds.length < 2}>Climax</button>
              </div>
            </div>

            {!!rounds.length && (
              <div className="mt-4 space-y-3">
                {rounds.map(r=> (
                  <div key={r.round} className="p-3 bg-white rounded-lg frame">
                    <div className="flex items-center justify-between">
                      <div className="text-sm uppercase tracking-wider text-slate/80">Round {r.round}</div>
                      <button className="tab" onClick={()=> vote(r.round)}>👍 {r.votes||0}</button>
                    </div>
                    <div className="mt-2 text-ink/80 whitespace-pre-wrap">{r.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Climax & Reveal */}
        {finale && (
          <div className="panel p-6 mt-6">
            <h2 className="text-ink font-semibold">Climax</h2>
            <p className="mt-2 text-ink/80 whitespace-pre-wrap text-lg">{finale.climax}</p>
            <div className="mt-4">
              <div className="text-sm uppercase tracking-wider text-slate/80">Moral</div>
              <p className="text-ink/80">{finale.moral}</p>
            </div>
            <div className="mt-4 text-right">
              <button className="btn btn-ember" onClick={saveLegend} disabled={saving}>{saving? 'Saving...' : 'Save to Book'}</button>
            </div>
          </div>
        )}
      </section>
    </main>
  );

  function vote(n) {
    setRounds(rounds.map(r=> r.round===n ? { ...r, votes: (r.votes||0)+1 } : r));
  }
}

function iconFor(type) {
  if (type==='HERO') return '🛡️';
  if (type==='VILLAIN') return '🐍';
  if (type==='CREATURE') return '🐉';
  return '✨';
}

function dataTitle(world, chars) {
  const hero = chars.find(c=> c.type==='HERO');
  const villain = chars.find(c=> c.type==='VILLAIN');
  return `The ${hero?.text?.split(' ')[0]||'Eclipse'} of ${world?.name||'Aether'}` + (villain? ` vs ${villain.text.split(' ')[0]}`:'');
}

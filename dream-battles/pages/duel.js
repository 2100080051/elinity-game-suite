import { useEffect, useMemo, useState } from 'react';

function Card({ card, selected, onClick }) {
  return (
    <button onClick={onClick} className={`glass p-3 w-full text-left card-tilt ${selected ? 'ring-2 ring-dream-400' : ''}`}>
      <div className="aspect-video w-full bg-black/30 rounded-xl overflow-hidden flex items-center justify-center">
        {card?.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-sm opacity-70">No image</div>
        )}
      </div>
      <div className="mt-3">
        <div className="font-semibold">{card.title}</div>
        <div className="text-sm opacity-80 line-clamp-2">{card.description}</div>
        <div className="text-xs mt-1 opacity-60">by {card.player} • {new Date(card.timestamp).toLocaleTimeString()}</div>
      </div>
    </button>
  );
}

export default function Duel() {
  const [fragment, setFragment] = useState('');
  const [player, setPlayer] = useState('Player 1');
  const [cards, setCards] = useState([]);
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [narration, setNarration] = useState('');
  const [winnerId, setWinnerId] = useState(null);
  const [error, setError] = useState('');
  const [opponentFragment, setOpponentFragment] = useState('');

  useEffect(() => { refreshCards(); }, []);

  async function refreshCards() {
    const res = await fetch('/api/cards');
    const data = await res.json();
    setCards(data);
  }

  async function submitDream() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fragment, player }) });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create card');
      await refreshCards();
      setFragment('');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const canBattle = useMemo(() => a && b && a !== b, [a, b]);

  async function startBattle() {
    if (!canBattle) return;
    setLoading(true); setError(''); setNarration(''); setWinnerId(null);
    try {
      const res = await fetch('/api/battle/narrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ a_id: a.id, b_id: b.id }) });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to narrate battle');
      }
      const text = await res.text();
      setNarration(text);
      const header = /^WINNER:\s*(\d+)/i.exec(text);
      const wId = header ? header[1] : null;
      setWinnerId(wId);
      if (wId) {
        await fetch('/api/battle/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ winner_id: wId, winner_player: (wId === a.id ? a.player : b.player) }) });
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function createOpponent() {
    if (!opponentFragment.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fragment: opponentFragment, player: 'Player 2' }) });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j.error || 'Failed to create opponent card');
      }
      const created = await res.json();
      await refreshCards();
      setOpponentFragment('');
      // Auto-select as B if A is already chosen
      if (a && (!b || b.id === a.id)) setB(created);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-2 gap-8">
      <section className="glass p-6">
        <h2 className="text-2xl font-bold">Dream Entry</h2>
        <p className="opacity-80 mt-1">Describe a shape, color, emotion, or a tiny story.</p>
        <div className="mt-4 grid gap-3">
          <input value={player} onChange={(e)=>setPlayer(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10" placeholder="Player name" />
          <input value={fragment} onChange={(e)=>setFragment(e.target.value)} className="w-full px-3 py-3 rounded-lg bg-white/10 border border-white/10" placeholder="What did you dream about? (≤20 words)" />
          <div className="flex items-center gap-3">
            <button disabled={!fragment || loading} onClick={submitDream} className="glass px-4 py-2 disabled:opacity-50">Submit Dream</button>
            <button onClick={refreshCards} className="px-4 py-2 border border-white/10 rounded-lg">Refresh</button>
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
        </div>
        <div className="mt-6">
          <h3 className="font-semibold">Preview Deck</h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cards.map((c)=> (
              <Card key={c.id} card={c} selected={a?.id===c.id || b?.id===c.id} onClick={()=> {
                if (!a || (a && b)) { setA(c); setB(null); }
                else if (a && !b) { setB(c); }
              }} />
            ))}
          </div>
          {cards.length < 2 && (
            <div className="mt-3 text-sm opacity-80">Create at least two cards to start a duel. Submit another fragment or use the opponent creator in the Battle Arena.</div>
          )}
        </div>
      </section>

      <section className="glass p-6">
        <h2 className="text-2xl font-bold">Battle Arena</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className={`glass p-3 ${winnerId && a?.id===winnerId ? 'ring-2 ring-emerald-400' : ''}`}>
            {a ? (
              <div>
                <Card card={a} />
                <div className="mt-2 text-xs opacity-70">Selected as A <button className="underline opacity-70 hover:opacity-100" onClick={()=>setA(null)}>clear</button></div>
              </div>
            ) : <div className="opacity-60">Select Card A</div>}
          </div>
          <div className={`glass p-3 ${winnerId && b?.id===winnerId ? 'ring-2 ring-emerald-400' : ''}`}>
            {b ? (
              <div>
                <Card card={b} />
                <div className="mt-2 text-xs opacity-70">Selected as B <button className="underline opacity-70 hover:opacity-100" onClick={()=>setB(null)}>clear</button></div>
              </div>
            ) : <div className="opacity-60">Select Card B</div>}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button disabled={!canBattle || loading} onClick={startBattle} className="glass px-4 py-2 disabled:opacity-50">Start Duel</button>
          <a href="/leaderboard" className="px-4 py-2 border border-white/10 rounded-lg">View Leaderboard</a>
          {!canBattle && <span className="text-sm opacity-80">Pick two different cards (A and B) to enable Start Duel.</span>}
        </div>
        {!b && (
          <div className="mt-6">
            <h3 className="font-semibold">Quick Opponent</h3>
            <div className="mt-2 flex items-center gap-2">
              <input value={opponentFragment} onChange={(e)=>setOpponentFragment(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10" placeholder="Opponent fragment (e.g., silver storm, thorny vines)" />
              <button disabled={!opponentFragment || loading} onClick={createOpponent} className="glass px-4 py-2 disabled:opacity-50">Create</button>
            </div>
            <div className="text-xs opacity-70 mt-1">Creates a new card for Player 2 and auto-selects it as Card B.</div>
          </div>
        )}
        {narration && (
          <div className="mt-6 p-4 rounded-xl bg-black/30 border border-white/10 whitespace-pre-wrap text-sm leading-relaxed">
            {narration}
          </div>
        )}
      </section>
    </div>
  );
}

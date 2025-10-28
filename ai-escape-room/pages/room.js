import { useEffect, useMemo, useState } from 'react';

function Timer({ seconds }) {
  const [t, setT] = useState(seconds);
  useEffect(() => { setT(seconds); }, [seconds]);
  useEffect(() => { const i = setInterval(()=> setT((x)=> Math.max(0, x-1)), 1000); return ()=> clearInterval(i); }, []);
  const m = Math.floor(t/60), s = t%60;
  return <div className="text-2xl font-mono">⏱️ {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</div>;
}

export default function Room() {
  const [id, setId] = useState(null);
  const [players, setPlayers] = useState('Player 1');
  const [state, setState] = useState(null);
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const qid = url.searchParams.get('id');
    if (qid) { setId(qid); refresh(qid); }
  }, []);

  async function createRoom() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/rooms', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ players: players.split(',').map(s=>s.trim()).filter(Boolean) }) });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create room');
      const data = await res.json();
      setId(data.id);
      setState(data);
      history.replaceState(null, '', `/room?id=${data.id}`);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function refresh(roomId=id) {
    if (!roomId) return;
    const res = await fetch(`/api/rooms/${roomId}`);
    const data = await res.json();
    setState(data);
  }

  async function requestHint() {
    if (!id) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/rooms/${id}/hint`, { method:'POST' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to get hint');
      const data = await res.json();
      setHint(data.hint);
      await refresh();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function submitAnswer() {
    if (!id || !answer) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/rooms/${id}/answer`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ answer }) });
      const text = await res.text();
      if (!res.ok) throw new Error(text || 'Failed to submit answer');
      // Show narration overlay inline
      alert(text);
      setAnswer('');
      await refresh();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-3 gap-6">
      <section className="panel md:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Room Overview</h2>
          <div>{state && <Timer seconds={state.time_left || 0} />}</div>
        </div>
        {!id && (
          <div className="mt-4 grid sm:grid-cols-[1fr_auto] gap-2">
            <input value={players} onChange={(e)=>setPlayers(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10" placeholder="Players (comma-separated)" />
            <button disabled={loading} onClick={createRoom} className="glass px-4 py-2">Create Room</button>
          </div>
        )}
        {error && <div className="text-red-400 text-sm mt-3">{error}</div>}
        {state && (
          <div className="mt-6">
            <div className="text-sm opacity-80">Room #{state.id} • Players: {state.players.join(', ')} • Points: {state.points}</div>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed opacity-95">{state.scenario}</div>
          </div>
        )}
      </section>
      <section className="panel">
        <h2 className="text-2xl font-bold">Puzzle</h2>
        <div className="mt-2 text-sm opacity-80">{state?.current_puzzle || 'Create a room to begin.'}</div>
        <div className="mt-4 grid gap-2">
          <input value={answer} onChange={(e)=>setAnswer(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10" placeholder="Type your answer" />
          <div className="flex items-center gap-2">
            <button disabled={!id || !answer || loading} onClick={submitAnswer} className="glass px-4 py-2 disabled:opacity-50">Submit Answer</button>
            <button disabled={!id || loading} onClick={requestHint} className="px-4 py-2 border border-white/10 rounded-lg">Request Hint</button>
          </div>
          {hint && <div className="text-xs opacity-80">Hint: {hint}</div>}
        </div>
        <div className="mt-6">
          <h3 className="font-semibold">Clue Ledger</h3>
          <div className="mt-2 max-h-48 overflow-auto text-sm space-y-1">
            {(state?.clues || []).map((c, i)=> <div key={i} className="opacity-90">• {c.text}</div>)}
            {(!state?.clues || state.clues.length===0) && <div className="opacity-70">No clues yet.</div>}
          </div>
        </div>
      </section>
    </div>
  );
}

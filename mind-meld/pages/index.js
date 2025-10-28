import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [phase, setPhase] = useState('intro'); // intro | playing | over
  const [players, setPlayers] = useState({ a: 'Player 1', b: 'Player 2' });
  const [category, setCategory] = useState('');
  const [aGuess, setAGuess] = useState('');
  const [bGuess, setBGuess] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [round, setRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(5);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(null); // { match, partial, points, reaction }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (phase === 'intro') {
      // start with waiting screen until user clicks start
    }
  }, [phase]);

  async function nextCategory() {
    setBusy(true);
    try {
      const res = await axios.post('/api/mindmeld', { action: 'category', round });
      const data = res.data || {};
      setCategory(data.category || 'Favorite Dessert');
      setAGuess(''); setBGuess(''); setResult(null); setRevealed(false);
      setPhase('playing');
    } finally { setBusy(false); }
  }

  async function reveal() {
    if (!category || !aGuess.trim() || !bGuess.trim()) return;
    setBusy(true);
    try {
      const payload = { action: 'judge', players, category, aGuess: aGuess.trim(), bGuess: bGuess.trim() };
      const res = await axios.post('/api/mindmeld', payload);
      const data = res.data || {};
      setResult(data);
      setRevealed(true);
      setScore(s => s + (data.points || 0));
    } finally { setBusy(false); }
  }

  async function endGame() {
    setBusy(true);
    try {
      const res = await axios.post('/api/mindmeld', { action: 'summary', score, rounds: round-1, players });
      const data = res.data || {};
      setResult({ summary: data.summary, title: data.title });
      setPhase('over');
    } finally { setBusy(false); }
  }

  function nextRound() {
    if (round >= maxRounds) return endGame();
    setRound(r => r + 1);
    nextCategory();
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          <span className="text-purplepop">🧠 Mind Meld</span> — How Aligned Are You?
        </h1>
        <p className="text-slate-300 max-w-2xl mx-auto">Guess what the other person would choose. Match minds, score points, and laugh along the way.</p>
      </header>

      {/* Names and rounds */}
      <div className="card p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm text-slate-300">Player 1</span>
          <input className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-neonblue/50" value={players.a} onChange={e=>setPlayers(p=>({...p,a:e.target.value}))} />
        </label>
        <label className="block">
          <span className="text-sm text-slate-300">Player 2</span>
          <input className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-neonblue/50" value={players.b} onChange={e=>setPlayers(p=>({...p,b:e.target.value}))} />
        </label>
        <div className="flex items-end gap-2">
          <label className="flex-1">
            <span className="text-sm text-slate-300">Rounds</span>
            <input type="number" min={3} max={10} className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" value={maxRounds} onChange={e=>setMaxRounds(Math.max(3, Math.min(10, parseInt(e.target.value || '5', 10))))} />
          </label>
          <button onClick={nextCategory} className="btn">Start / Next Category</button>
        </div>
      </div>

      {/* Category Card */}
      <div className="card p-5 flipIn">
        <div className="text-sm text-slate-400">Category</div>
        <div className="text-2xl font-semibold">{category || 'Click Start / Next Category'}</div>
        {category && <div className="text-slate-300 text-sm mt-1">Guess what the other player would choose.</div>}
      </div>

      {/* Player Inputs and results */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-5 space-y-2">
          <div className="text-sm text-slate-400">{players.a}’s guess (for {players.b})</div>
          <input className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" value={aGuess} onChange={e=>setAGuess(e.target.value)} disabled={!category || revealed} />
        </div>
        <div className="card p-5 space-y-2">
          <div className="text-sm text-slate-400">{players.b}’s guess (for {players.a})</div>
          <input className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" value={bGuess} onChange={e=>setBGuess(e.target.value)} disabled={!category || revealed} />
        </div>
        <div className="card p-5 space-y-3">
          <div className="text-sm text-slate-400">Controls</div>
          <button onClick={reveal} disabled={!category || !aGuess.trim() || !bGuess.trim() || revealed} className="btn">Reveal</button>
          <div className="text-sm text-slate-400">Scoreboard</div>
          <div className={`text-xl font-semibold ${result?.points ? 'flash' : ''}`}>Sync Score: {score} / {round-1 + (revealed?1:0)}</div>
          <div className="text-slate-300">Round {round} / {maxRounds}</div>
          <div className="flex gap-2">
            <button onClick={nextRound} disabled={!revealed} className="btn">Next Round</button>
            <button onClick={endGame} className="btn">End Game</button>
          </div>
        </div>
      </section>

      {/* Result Area */}
      <div className="card p-5">
        <div className="text-sm text-slate-400">Result</div>
        {!revealed && <div className="text-slate-400">Enter guesses and click Reveal.</div>}
        {revealed && result && (
          <div className="space-y-2">
            <div>Guesses: <span className="text-neonblue">{players.a}</span> → “{aGuess}”, <span className="text-orangefun">{players.b}</span> → “{bGuess}”</div>
            {result.reaction && <div className="text-slate-200">{result.reaction}</div>}
            <div className="text-slate-300">Points this round: {result.points || 0}</div>
          </div>
        )}

        {phase === 'over' && result?.summary && (
          <div className="mt-3">
            <div className="text-xl font-bold">{result.title || 'Mind Meld Summary'}</div>
            <div className="text-slate-200 whitespace-pre-wrap mt-1">{result.summary}</div>
          </div>
        )}
      </div>

      {busy && <div className="text-center text-sm text-slate-400">Thinking…</div>}
    </main>
  );
}

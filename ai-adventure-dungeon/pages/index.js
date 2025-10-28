import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

const ROLES = ['Adventurer 🗡️','Healer 🌿','Rogue 🕶️','Mage 🔮','Bard 🎵'];
const THEMES = ['ruins','ice temple','forest labyrinth','clockwork citadel'];

export default function Home() {
  const [screen, setScreen] = useState('title'); // title | howto | select | play | end
  const [team, setTeam] = useState('');
  const [players, setPlayers] = useState([{ name: 'Player 1', role: ROLES[0] }]);
  const [narration, setNarration] = useState([]); // {text}
  const [roomHints, setRoomHints] = useState([]); // suggestions/actions
  const [stats, setStats] = useState({ health: 100, loot: 0, xp: 0, depth: 1 });
  const [busy, setBusy] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [theme, setTheme] = useState(THEMES[0]);
  const [lastRoll, setLastRoll] = useState(null);
  const audioRef = useRef(null);
  const [audioOn, setAudioOn] = useState(false);

  useEffect(() => { loadRun(); }, []);

  async function loadRun() {
    try { const res = await axios.get('/api/run'); setLastRun(res.data||null); } catch {}
  }
  async function saveRun() {
    const data = { team, players, stats, narration, roomHints, theme };
    await axios.post('/api/run', data);
  }

  async function start() {
    setBusy(true);
    try {
      const payload = { action: 'start', team, players };
      const res = await axios.post('/api/dungeon', payload);
      const d = res.data || {};
      if (d.intro) setNarration([{ text: d.intro }]);
      setRoomHints([]);
      setStats(s => ({ ...s, depth: 1, health: 100, loot: 0, xp: 0 }));
      setScreen('play');
      await nextFloor();
    } finally { setBusy(false); }
  }

  async function nextFloor() {
    setBusy(true);
    try {
      const payload = { action: 'floor', players, depth: stats.depth, theme };
      const res = await axios.post('/api/dungeon', payload);
      const d = res.data || {};
      if (d.rooms) setRoomHints(d.rooms);
      if (d.title) setNarration(n => [...n, { text: `— ${d.title} —` }]);
      if (d.theme) setNarration(n => [...n, { text: `Theme: ${d.theme}` }]);
    } finally { setBusy(false); }
  }

  async function act(kind, detail) {
    setBusy(true);
    try {
      const payload = { action: 'act', kind, detail, players, stats };
      const res = await axios.post('/api/dungeon', payload);
      const d = res.data || {};
      if (d.narration) setNarration(n => [...n, { text: d.narration }]);
      if (d.stats) setStats(d.stats);
      if (d.rooms) setRoomHints(d.rooms);
      if (typeof d.roll === 'number') setLastRoll(d.roll);
      if (d.finished) { setScreen('end'); await saveRun(); }
    } finally { setBusy(false); }
  }

  async function status() {
    const res = await axios.post('/api/dungeon', { action: 'status', players, stats });
    const d = res.data || {};
    if (d.tick) setNarration(n => [...n, { text: d.tick }]);
  }

  async function endGame() {
    setBusy(true);
    try {
      const res = await axios.post('/api/dungeon', { action: 'end', players, stats });
      const d = res.data || {};
      if (d.summary) setNarration(n => [...n, { text: d.summary }]);
      setScreen('end');
      await saveRun();
    } finally { setBusy(false); }
  }

  const canContinue = !!lastRun?.players?.length;

  // Keyboard shortcuts for quick actions
  useEffect(() => {
    if (screen !== 'play') return;
    const onKey = (e) => {
      if (busy) return;
      const map = {
        '1': () => act('fight'),
        '2': () => act('sneak'),
        '3': () => act('negotiate'),
        '4': () => act('use'),
        '5': () => act('explore'),
      };
      if (map[e.key]) map[e.key]();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, busy, players, stats]);

  // Ambient audio control
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (audioOn) { a.volume = 0.35; a.play().catch(()=>{}); }
    else { a.pause(); }
  }, [audioOn]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight heading-gradient">
          🏰 AI Adventure Dungeon — Explore, Improvise, Survive
        </h1>
        <p className="text-mist/90">Co-op storytelling RPG. Each run is new. Choose roles, face rooms, and outwit the dungeon.</p>
        <div className="flex items-center justify-center gap-2 text-xs">
          <button className={`btn btn-ghost ${audioOn? 'ring-1 ring-gold/60':''}`} onClick={()=>setAudioOn(v=>!v)}>{audioOn? 'Ambient: On 🔊':'Ambient: Off 🔇'}</button>
          <div className="dice" title="Luck roll">{busy? '…' : (lastRoll ?? '—')}</div>
        </div>
        <audio ref={audioRef} loop src="https://cdn.pixabay.com/download/audio/2022/03/15/audio_64582d4c6f.mp3?filename=dark-ambience-loop-ambient-101107.mp3" />
      </header>

      {screen === 'title' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card p-6 space-y-3">
            <div className="text-sm">Start a New Adventure</div>
            <label className="block">
              <div className="text-xs">Team Name (optional)</div>
              <input className="mt-1 input" value={team} onChange={e=>setTeam(e.target.value)} />
            </label>
            <label className="block">
              <div className="text-xs">Dungeon Theme</div>
              <select className="mt-1 select" value={theme} onChange={e=>setTheme(e.target.value)}>
                {THEMES.map((t,i)=>(<option key={i} value={t}>{t}</option>))}
              </select>
            </label>
            <button className="btn btn-gold" onClick={()=>setScreen('select')}>Start Adventure</button>
            <button className="btn" onClick={()=>setScreen('howto')}>How to Play</button>
            <button className="btn" disabled={!canContinue} onClick={()=>{ if(canContinue){ setTeam(lastRun.team||''); setPlayers(lastRun.players||players); setStats(lastRun.stats||stats); setNarration(lastRun.narration||[]); setRoomHints(lastRun.roomHints||[]); setTheme(lastRun.theme||theme); setScreen('play'); } }}>Continue Last Run</button>
          </div>
          <div className="card p-6 space-y-3">
            <div className="text-sm">Roles</div>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r,i)=>(<span key={i} className="badge">{r}</span>))}
            </div>
            <div className="text-xs text-mist/80">Pick complementary roles for balance.</div>
          </div>
        </div>
      )}

      {screen === 'howto' && (
        <div className="card p-6 space-y-3">
          <div className="text-gold font-semibold">How to Play</div>
          <ul className="list-disc list-inside space-y-1 text-mist/90">
            <li>Choose 1–4 players and assign roles.</li>
            <li>Each floor has three rooms: a puzzle, a creature, and a twist.</li>
            <li>Use quick actions or type custom actions; outcomes vary with a luck roll (1–20).</li>
            <li>Keep an eye on health, loot, and XP. Reach the artifact or boss to win.</li>
          </ul>
          <div>
            <button className="btn" onClick={()=>setScreen('title')}>Back</button>
          </div>
        </div>
      )}

      {screen === 'select' && (
        <div className="card p-6 space-y-4">
          <div className="text-gold font-semibold">Character Selection</div>
          <div className="grid sm:grid-cols-2 gap-4">
            {players.map((p, idx)=> (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                <input className="px-3 py-2 rounded-lg bg-white/5 border border-white/10" value={p.name} onChange={e=>setPlayers(ps=>ps.map((pp,i)=> i===idx?{...pp, name:e.target.value}:pp))} />
                <select className="px-3 py-2 rounded-lg bg-white/5 border border-white/10" value={p.role} onChange={e=>setPlayers(ps=>ps.map((pp,i)=> i===idx?{...pp, role:e.target.value}:pp))}>
                  {ROLES.map((r,i)=>(<option key={i} value={r}>{r}</option>))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={()=> setPlayers(ps => [...ps, { name: `Player ${ps.length+1}`, role: ROLES[ps.length%ROLES.length] }])}>+ Add Player</button>
            <button className="btn" onClick={()=> setPlayers(ps => ps.length>1? ps.slice(0,-1): ps)}>− Remove Player</button>
            <button className="btn btn-gold" onClick={start} disabled={busy}>Begin Adventure</button>
            <button className="btn" onClick={()=>setScreen('title')}>Back</button>
          </div>
        </div>
      )}

      {screen === 'play' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5 space-y-3">
              <div className="text-sm text-mist/80">Dungeon Narration</div>
              <div className="space-y-2">
                {narration.map((n,i)=>{
                  const isLast = i === narration.length - 1;
                  return (<div key={i} className={`narration ${isLast? 'typewriter':''}`}>{n.text}</div>);
                })}
              </div>
            </div>

            <div className="card p-5 space-y-3">
              <div className="text-sm text-mist/80">Quick Actions</div>
              <div className="flex flex-wrap gap-2">
                <button className="btn" onClick={()=>act('fight')}>1) Fight ⚔️</button>
                <button className="btn" onClick={()=>act('sneak')}>2) Sneak 🕶️</button>
                <button className="btn" onClick={()=>act('negotiate')}>3) Negotiate 💬</button>
                <button className="btn" onClick={()=>act('use')}>4) Use Item 🪄</button>
                <button className="btn" onClick={()=>act('explore')}>5) Explore 🔍</button>
              </div>
              {roomHints?.length>0 && (
                <div className="pt-2">
                  <div className="text-xs text-mist/70 mb-1">Room choices</div>
                  <div className="flex flex-wrap gap-2">
                    {roomHints.map((r,i)=>(<button key={i} className="chip" onClick={()=>act('room', r)}>{r}</button>))}
                  </div>
                </div>
              )}
            </div>

            <div className="card p-5 flex gap-2 items-center">
              <button className="btn" onClick={status}>Status Update</button>
              <button className="btn" onClick={nextFloor}>Next Floor</button>
              <button className="btn btn-gold" onClick={endGame}>End Adventure</button>
              {busy && <span className="text-xs text-mist/70">Rolling the luck die…</span>}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="card p-5 space-y-2">
              <div className="text-sm text-mist/80">Party</div>
              <ul className="space-y-1">
                {players.map((p,i)=>(<li key={i}><span className="text-gold">{p.name}</span> — {p.role}</li>))}
              </ul>
            </div>
            <div className="card p-5 space-y-2 torch">
              <div className="text-sm text-mist/80">Stats</div>
              <div>❤️ Health: <span className="text-gold font-semibold">{stats.health}</span></div>
              <div>💰 Loot: <span className="text-gold font-semibold">{stats.loot}</span></div>
              <div>⭐ XP: <span className="text-gold font-semibold">{stats.xp}</span></div>
              <div>🕳️ Depth: <span className="text-gold font-semibold">{stats.depth}</span></div>
            </div>
          </aside>
        </div>
      )}

      {screen === 'end' && (
        <div className="card p-6 space-y-3">
          <div className="text-gold font-semibold">Adventure Summary</div>
          <div className="text-mist/90">{narration.slice(-1)[0]?.text || 'Your party exits the dungeon, stories etched in memory.'}</div>
          <div className="pt-2">
            <button className="btn btn-gold" onClick={()=>{ setScreen('title'); setNarration([]); setRoomHints([]); setStats({ health:100, loot:0, xp:0, depth:1 }); }}>Play Again</button>
          </div>
          <div className="confetti-wrapper">
            {Array.from({length: 24}).map((_,i)=>{
              const left = Math.random()*100;
              const delay = Math.random()*1.5;
              const dur = 2.8 + Math.random()*1.2;
              return <span key={i} className="confetti" style={{ left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${dur}s` }} />
            })}
          </div>
        </div>
      )}
    </main>
  );
}

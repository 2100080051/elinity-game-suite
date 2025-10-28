import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Arena() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const [s, setS] = useState(null);
  const [myEntries, setMyEntries] = useState({});
  const [busy, setBusy] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [countdown, setCountdown] = useState(0);

  async function load() {
    if (!id) return;
    const res = await fetch(`/api/state?id=${id}`);
    if (res.ok) setS(await res.json());
  }

  useEffect(()=>{ load(); }, [id]);

  async function nextRound() {
    setBusy(true);
    try {
      const res = await fetch('/api/generate_prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (res.ok) setS(await res.json());
      setMyEntries({});
      // 90s submission window
      setCountdown(90);
      const int = setInterval(()=> setCountdown(c => { if (c<=1){ clearInterval(int); return 0; } return c-1; }), 1000);
    } finally { setBusy(false); }
  }

  async function submit(player) {
    const text = myEntries[player.id] || '';
    setBusy(true);
    try {
      const res = await fetch('/api/submit_entry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, playerId: player.id, entry: text }) });
      if (res.ok) setS(await res.json());
    } finally { setBusy(false); }
  }

  async function evaluate() {
    setBusy(true);
    try {
      const res = await fetch('/api/evaluate_round', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (res.ok) {
        const data = await res.json();
        setS(data);
        setConfetti(true);
        setTimeout(()=>setConfetti(false), 1500);
      }
    } finally { setBusy(false); }
  }

  async function endGame() {
    setBusy(true);
    try {
      const res = await fetch('/api/end_game', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (res.ok) setS(await res.json());
    } finally { setBusy(false); }
  }

  const leaderboard = useMemo(()=>{
    const lb = s?.leaderboard || {}; return Object.entries(lb).sort((a,b)=>b[1]-a[1]);
  }, [s]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Head>
        <title>Arena · Creative Duel Arena · elinity</title>
      </Head>

      {showIntro && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="text-sm uppercase tracking-wider text-slate-400 mb-1">elinity</div>
            <h2 className="text-2xl font-semibold">Welcome, creative warriors of the Arena ⚔️</h2>
            <p className="text-slate-300 mt-2">Quick prompts. Fast responses. Witty judging. Gather your courage and let imagination lead.</p>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn" onClick={()=>router.push('/')}>Back</button>
              <button className="btn btn-primary" onClick={()=>setShowIntro(false)}>Enter Arena</button>
            </div>
          </div>
        </div>
      )}

      {confetti && (
        <div className="confetti" style={{left:0, right:0, top:0, height:0}}>
          {Array.from({length:20}).map((_,i)=> (
            <i key={i} style={{left: Math.random()*100+'%', background: ['#22d3ee','#ec4899','#7c3aed'][i%3], animationDelay: (Math.random()*0.4)+'s'}} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Round {s?.round || 0}</h2>
        <div className="flex gap-2">
          <button className="btn" onClick={nextRound} disabled={busy}>Next Round</button>
          <button className="btn" onClick={endGame} disabled={busy}>End Game</button>
        </div>
      </div>

      <div className="grid md:grid-cols-[2fr,1fr] gap-6">
        <div>
          <div className="panel p-4 mb-4 relative overflow-hidden">
            <div className="orbit-layer">
              {Array.from({length:10}).map((_,i)=> (
                <i key={i} style={{ left: (10+(i*6))+'%', top: (10+(i*7))+'%', animationDelay: (i*0.3)+'s' }} />
              ))}
            </div>
            <div className="text-sm text-slate-400">Prompt</div>
            <div className="text-lg">{s?.prompt || 'Click Next Round to begin!'}</div>
            {countdown>0 && (
              <div className="mt-3">
                <div className="text-xs text-slate-400 mb-1">Submission time left: {countdown}s</div>
                <div className="countdown"><span style={{ width: `${(100*countdown/90).toFixed(1)}%` }}></span></div>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {(s?.players || []).map(p => (
              <div key={p.id} className="panel p-4">
                <div className="text-sm text-slate-300 mb-1">{p.name}</div>
                <textarea value={myEntries[p.id]||''} onChange={e=>setMyEntries({...myEntries, [p.id]: e.target.value})} placeholder="Type your entry…" className="w-full h-28 rounded-lg bg-black/30 border border-white/10 p-2" />
                <button onClick={()=>submit(p)} className="btn mt-2" disabled={busy}>Submit Entry</button>
              </div>
            ))}
          </div>

          <div className="panel p-4 mt-4 relative overflow-hidden">
            <div className="wave-bg">
              <div className="wave" style={{top:'-10%'}}></div>
              <div className="wave" style={{top:'10%'}}></div>
              <div className="wave" style={{top:'30%'}}></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">Judging</div>
              <button className="btn" onClick={evaluate} disabled={busy}>Evaluate Round</button>
            </div>
            <div className="mt-3 space-y-2">
              {(s?.judging || []).map((j,i)=> (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/10">
                  <div>
                    <div className="font-medium">{j.player}</div>
                    <div className="text-xs text-slate-400">O:{j.originality} S:{j.style} W:{j.wit} +{j.bonus}</div>
                    <div className="text-slate-300 text-sm">{j.comment}</div>
                  </div>
                  <div className="text-lg font-semibold">{j.total}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="panel p-4">
            <div className="text-sm text-slate-400">Leaderboard</div>
            <div className="mt-2 space-y-2">
              {leaderboard.map(([name, total], i) => (
                <div key={name} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${i===0? 'bg-emerald-500/10 border-emerald-400/30' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${i===0?'bg-emerald-400':'bg-slate-400'}`}></span>
                    <span>{name}</span>
                  </div>
                  <div className="font-semibold">{total}</div>
                </div>
              ))}
            </div>
          </div>
          {s?.summary && (
            <div className="panel p-4 mt-4">
              <div className="text-sm text-slate-400">Final Recap</div>
              <div className="mt-2">{s.summary}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

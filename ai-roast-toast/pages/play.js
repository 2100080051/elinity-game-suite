import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';

export default function Play(){
  const router = useRouter();
  const { gameId: gid } = router.query;
  const [gameId, setGameId] = useState('');
  const [state, setState] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [dingedRound, setDingedRound] = useState(0);
  const endRef = useRef(null);
  const prevToast = useRef('');

  useEffect(()=>{ if (gid) setGameId(String(gid)); },[gid]);

  async function load(){
    if (!gameId) return;
    const res = await fetch(`/api/state?gameId=${encodeURIComponent(gameId)}`);
    const data = await res.json();
    setState(data);
  }
  useEffect(()=>{ load(); const t=setInterval(load, 3000); return ()=>clearInterval(t); }, [gameId]);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); }, [state?.roasts?.length]);
  useEffect(()=>{
    // Play a soft ding when a new toast appears
    if (state?.toast && (state.round||0) !== dingedRound){
      try{
        const ctx = new (window.AudioContext||window.webkitAudioContext)();
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type='sine'; o.frequency.setValueAtTime(880, ctx.currentTime);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime+0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.35);
        o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime+0.4);
      }catch{}
      setDingedRound(state.round||0);
    }
  }, [state?.toast, state?.round]);
  useEffect(()=>{
    // Play a soft ding when a new toast appears
    const t = state?.toast || '';
    if (t && t !== prevToast.current){
      try{
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type='triangle'; o.frequency.value = 880; g.gain.value = 0.0001; o.connect(g); g.connect(ctx.destination);
        o.start();
        const now = ctx.currentTime; g.gain.exponentialRampToValueAtTime(0.08, now+0.01); g.gain.exponentialRampToValueAtTime(0.0001, now+0.25);
        setTimeout(()=>{ o.stop(); ctx.close(); }, 300);
      }catch{}
    }
    prevToast.current = t;
  }, [state?.toast]);

  async function ensurePlayer(){
    if (playerId) return playerId;
    // Create a quick local player if none selected
    const name = `Player ${Math.random().toString(36).slice(2,5)}`;
    const res = await fetch('/api/add_player', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ gameId, name }) });
    const data = await res.json();
    setPlayerId(data.playerId);
    await load();
    return data.playerId;
  }

  async function startRound(){
    setLoading(true);
    await fetch('/api/start_round', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ gameId }) });
    setLoading(false);
    load();
  }

  async function submit(){
    if (!text.trim()) return;
    const pid = await ensurePlayer();
    await fetch('/api/submit_roast', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ gameId, playerId: pid, text }) });
    setText('');
    load();
  }

  async function makeToast(){
    setLoading(true);
    await fetch('/api/make_toast', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ gameId }) });
    setLoading(false);
    load();
  }

  const target = useMemo(()=> state?.players?.find(p=>p.id===state?.targetId), [state]);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/70">Round {state?.round||0} {target? `• Target: ${target.name}`:''}</div>
            <div className="flex gap-2">
              <button className="btn" onClick={startRound} disabled={loading}>Start / Next Round</button>
              <button className="btn" onClick={makeToast} disabled={loading || !state?.prompt || state?.toast}>Make Toast</button>
            </div>
          </div>
          <div className="mt-3 grid md:grid-cols-2 gap-4 items-start">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-glow">
              <div className="text-white/70 text-sm mb-1">Roast Prompt</div>
              <div className="text-lg">🔥 {state?.prompt || 'Press "Start / Next Round" to get a prompt'}</div>
            </div>
            <div className="space-y-3">
              <div className="panel p-4">
                <div className="text-white/70 text-sm mb-1">Host Feed</div>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {state?.hostLog?.slice(-6).map((h,i)=> (
                    <div key={i} className="chat-item">
                      <span className="text-white/60 text-xs">ElinityAI:</span> {h.text}
                    </div>
                  ))}
                </div>
              </div>
              <div className={`toast-card ${state?.toast? 'animate-heart':''}`}>
                <div className="text-white/70 text-sm mb-1">ElinityAI Toast</div>
                <div className="text-lg">{state?.toast || 'Toast will appear here after roasts.'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel p-4">
          <div className="text-white/70 text-sm mb-2">Roasts</div>
          <div className="max-h-64 overflow-auto space-y-2">
            {state?.roasts?.map((r,i)=> (
              <div key={i} className="chat-item">
                <span className="text-white/60 text-xs">{r.name}:</span> {r.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="pt-3 flex gap-2">
            <input value={text} onChange={e=>setText(e.target.value)} placeholder="Write a playful roast (1–2 lines)" className="input" />
            <button className="btn-primary" onClick={submit}>Submit Roast</button>
          </div>
          <div className="mt-2 text-white/60 text-sm">Reactions: <span className="mx-1">😂</span> <span className="mx-1">🧡</span> <span className="mx-1">👏</span></div>
        </div>
      </div>

      <aside className="panel p-4 h-fit">
        <div className="text-white/70 text-sm mb-2">Players</div>
        <div className="flex flex-wrap gap-2">
          {state?.players?.map(p=> (
            <button key={p.id} className={`badge ${p.id===playerId? 'ring-2 ring-white/40':''}`} onClick={()=>setPlayerId(p.id)}>{p.name}</button>
          ))}
        </div>
        <div className="mt-4 text-white/70 text-sm">Tip: Click your name to author roasts. No name? The game will add a quick one for you.</div>
      </aside>
    </div>
  );
}

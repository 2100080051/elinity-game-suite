import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

export default function Game(){
  const router = useRouter();
  const { gameId, playerId } = router.query;
  const [state, setState] = useState(null);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState('');
  const chatEndRef = useRef(null);

  async function load(){
    if (!gameId || !playerId) return;
    const res = await fetch(`/api/state?gameId=${encodeURIComponent(gameId)}&playerId=${encodeURIComponent(playerId)}`);
    const data = await res.json();
    setState(data);
  }
  useEffect(()=>{ load(); const t = setInterval(load, 3000); return ()=>clearInterval(t); }, [gameId, playerId]);
  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:'smooth'}); }, [state?.journal?.length]);

  async function send(){
    if (!msg.trim()) return;
    setSending(true);
    await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ gameId, playerId, message: msg }) });
    setMsg(''); setSending(false); setFlash('shared a clue'); setTimeout(()=>setFlash(''), 1200); load();
  }

  async function move(label){
    await fetch('/api/move', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ gameId, playerId, label }) });
    load();
  }

  useEffect(()=>{
    function onKey(e){
      if (e.key==='ArrowLeft') move('A');
      if (e.key==='ArrowUp') move('B');
      if (e.key==='ArrowRight') move('C');
      if ((e.ctrlKey||e.metaKey) && e.key==='Enter') send();
    }
    window.addEventListener('keydown', onKey);
    return ()=>window.removeEventListener('keydown', onKey);
  }, [gameId, playerId, msg]);

  if (!state) return <div className="text-white/70">Joining the labyrinth…</div>;

  const { current, neighbors, stats, exitRevealed } = state;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/70">Player: {stats.player.slice(0,6)} | Nodes Seen: {stats.nodesSeen}</div>
            <div className="flex items-center gap-2">
              {flash && <div className="badge animate-pulse">You {flash}</div>}
              {exitRevealed && <div className="badge">Exit Revealed</div>}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-white/70 text-sm">Current Node</div>
            <div className="text-lg whitespace-pre-line">{current.description}</div>
            {current.puzzles?.length>0 && (
              <div className="mt-2 p-3 rounded-lg border border-white/10 bg-white/5">
                <div className="text-white/70 text-sm">Puzzle hint</div>
                <ul className="list-disc list-inside text-white/85">
                  {current.puzzles.map((z,i)=>(<li key={i}>{z.hint}</li>))}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {neighbors.map(n => (
              <button key={n.label} disabled={!n.unlocked} className="neighbor" onClick={()=>move(n.label)} title={n.unlocked? 'Open path' : 'Locked'}>
                <div className="text-xl font-semibold flex items-center gap-2">
                  <span>{n.label}</span>
                  {!n.unlocked && <span aria-hidden>🔒</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <div className="text-white/70 text-sm mb-1">Team Journal</div>
          <div className="max-h-64 overflow-auto space-y-1">
            {state.journal.map((j,i)=>(
              <div key={i} className="journal">
                <span className="text-white/60 text-xs">{j.playerId.slice(0,6)}:</span> {j.msg}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="pt-3 flex gap-2">
            <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>{ if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){send();} }} placeholder="Share what you see (Ctrl+Enter to send)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-white/20" />
            <button disabled={sending} className="btn-primary" onClick={send}>{sending ? 'Sending…' : 'Send'}</button>
          </div>
        </div>
      </div>

      <aside className="panel p-4 h-fit">
        <div className="text-white/70 text-sm">How to play</div>
        <ul className="list-disc list-inside text-white/80 mt-1">
          <li>Share concise clues from your current room.</li>
          <li>Try moving with A/B/C or arrow keys.</li>
          <li>Locked paths unlock when teammates find keys, switches, or mirrors.</li>
        </ul>
      </aside>
    </div>
  );
}

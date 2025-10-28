import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';

function useQuery(){
  const router = useRouter();
  return useMemo(()=>{
    const q = Object.create(null); if(!router?.asPath) return q;
    const idx = router.asPath.indexOf('?'); if(idx===-1) return q;
    const sp = new URLSearchParams(router.asPath.slice(idx+1)); sp.forEach((v,k)=>q[k]=v); return q;
  },[router?.asPath]);
}

function useBeatViz(){
  const [tick, setTick] = useState(0);
  useEffect(()=>{ const id = setInterval(()=>setTick(t=>t+1), 500); return ()=>clearInterval(id); },[]);
  return tick;
}

export default function Arena(){
  const router = useRouter();
  const { roomId } = router.query || {};
  const query = useQuery();
  const [playerId, setPlayerId] = useState(query.playerId || '');
  const [name, setName] = useState('');
  const [state, setState] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const beatTick = useBeatViz();

  async function fetchState(){
    if(!roomId) return; try{ const r = await fetch(`/api/state?roomId=${encodeURIComponent(roomId)}`); const d = await r.json(); if(!r.ok) throw new Error(d?.error||'Failed'); setState(d); setError(''); }catch(e){ setError(String(e.message||e)); }
  }
  useEffect(()=>{ if(!roomId) return; fetchState(); const id = setInterval(fetchState, 1200); return ()=>clearInterval(id); },[roomId]);

  async function ensureJoined(){
    if(playerId || !roomId) return; if(!name.trim()) return;
    try{
      const r = await fetch('/api/join_room', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ roomId, name: name.trim()||'MC' }) });
      const d = await r.json(); if(!r.ok) throw new Error(d?.error||'Join failed'); setPlayerId(d.playerId);
      router.replace({ pathname: router.pathname, query: { roomId, playerId: d.playerId } }, undefined, { shallow: true });
    }catch(e){ setError(String(e.message||e)); }
  }

  async function setDifficulty(d){
    if(!roomId) return; try{ const r = await fetch('/api/set_difficulty', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ roomId, difficulty: d }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); }catch(e){ setError(String(e.message||e)); }
  }

  async function startRound(){
    if(!roomId) return; setLoading(true); try{ const r = await fetch('/api/start_round', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ roomId }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); }catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function submit(){
    if(!roomId || !playerId) return; const val = text.trim(); if(!val) return;
    try{ const r = await fetch('/api/submit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ roomId, playerId, text: val }) }); const j = await r.json(); if(!r.ok || !j.ok) throw new Error(j?.error||'Submit failed'); setText(''); fetchState(); }catch(e){ setError(String(e.message||e)); }
  }

  async function judge(){
    if(!roomId) return; setLoading(true); try{ const r = await fetch('/api/judge', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ roomId }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); }catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function nextRound(){
    if(!roomId) return; try{ const r = await fetch('/api/next_round', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ roomId }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); }catch(e){ setError(String(e.message||e)); }
  }

  const myPrompt = (state?.prompts||[]).find(p=>p.playerId===playerId);

  return (
    <div className="space-y-6">
      <div className="panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="badge">Room</div>
          <div className="text-lg font-semibold select-all">{roomId}</div>
          {state?.beat && <div className="badge">Beat: {state.beat}</div>}
          {state?.theme && <div className="badge">Theme: {state.theme}</div>}
          {state?.bpm && <div className="badge">{state.bpm} BPM</div>}
          {state?.difficulty && <div className="badge">{state.difficulty.toUpperCase()}</div>}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={()=>setDifficulty('casual')}>Casual</button>
          <button className="btn" onClick={()=>setDifficulty('hard')}>Hard</button>
          <button className="btn" onClick={()=>setDifficulty('chaos')}>Chaos</button>
          <button className="btn-primary" onClick={startRound} disabled={loading}>Start Round</button>
        </div>
      </div>

      {!playerId && (
        <div className="panel p-4 flex items-center gap-3">
          <div className="text-white/80">Enter an MC name to join:</div>
          <input className="input w-64" value={name} onChange={(e)=>setName(e.target.value)} placeholder="MC Name" />
          <button className="btn-primary" onClick={ensureJoined} disabled={!name.trim()}>Join</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          <div className="turntable p-4">
            <div className="flex items-end gap-1 h-20">
              {Array.from({length:20}).map((_,i)=> (
                <div key={i} className="viz-bar animate-bars" style={{animationDelay:`${(i%5)*0.1}s`}} />
              ))}
            </div>
            <div className="mt-2 text-white/70 text-sm">Neon Turntable — vibe meter</div>
          </div>

          <div className="panel p-4">
            <div className="text-white/70 text-sm">Freestyle</div>
            {myPrompt ? (
              <div className="mt-2 text-white/80 text-sm">Your words: {myPrompt.words.join(' • ')}</div>
            ) : (
              <div className="mt-2 text-white/60 text-sm">Start a round to receive your word prompts.</div>
            )}
            <div className="mt-2 space-y-2">
              <textarea className="input min-h-[120px]" value={text} onChange={e=>setText(e.target.value)} placeholder="Drop 4–8 lines of bars..." />
              <button className="btn-primary" onClick={submit} disabled={!playerId || !text.trim()}>🎤 Submit Verse</button>
            </div>
          </div>

          <div className="panel p-4">
            <div className="flex items-center gap-2">
              <button className="btn" onClick={judge}>🎶 Judge Round</button>
              {state?.phase==='results' && (
                <button className="btn" onClick={nextRound}>Next Round</button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="panel p-4">
            <div className="text-white/70 text-sm">DJ Booth</div>
            {state?.intro ? (
              <div className="mt-2">
                <div className="text-white/90">{state.intro}</div>
              </div>
            ) : (
              <div className="mt-2 text-white/60 text-sm">Hit Start Round to drop a beat and theme.</div>
            )}
            <div className="mt-3 space-y-2">
              {(state?.feedback||[]).map((f,i)=> (
                <div key={i} className="p-2 border border-white/10 rounded-lg">
                  <div className="text-white/70 text-xs">{state.players.find(p=>p.id===f.playerId)?.name}</div>
                  <div className="text-white/90">{f.lines?.[0]}</div>
                  <div className="text-white/80 text-sm">Flow {f.scores?.flow} • Creativity {f.scores?.creativity} • Wordplay {f.scores?.wordplay}</div>
                </div>
              ))}
              {state?.winnerId && (
                <div className="p-3 rounded-lg border border-white/10 bg-white/5">
                  <div className="text-white/70 text-sm">🏆 Winner</div>
                  <div className="text-white/90 text-lg">{state.players.find(p=>p.id===state.winnerId)?.name}</div>
                </div>
              )}
            </div>
          </div>

          <div className="panel p-4">
            <div className="text-white/70 text-sm">Players</div>
            <div className="space-y-2 mt-2">
              {(state?.players||[]).map(p=> (
                <div key={p.id} className={`flex items-center justify-between p-2 rounded-lg border border-white/10 ${p.id===playerId?'bg-white/10':''}`}>
                  <div>{p.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="panel p-3 text-sm text-red-300 border-red-500/30">{error}</div>
      )}
    </div>
  );
}

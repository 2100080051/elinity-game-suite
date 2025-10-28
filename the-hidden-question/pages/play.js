import { useEffect, useMemo, useRef, useState } from 'react';

function useRoundId(){
  const [id, setId] = useState(null);
  useEffect(()=>{ setId(localStorage.getItem('hiddenq.round')); },[]);
  return id;
}

export default function Play(){
  const roundId = useRoundId();
  const [data, setData] = useState(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [asQuestioner, setAsQuestioner] = useState(false);
  const timerRef = useRef();
  const [timerKey, setTimerKey] = useState(0);

  async function load(){
    if(!roundId) return;
    const r = await fetch(`/api/round/${roundId}`);
    const d = await r.json();
    setData(d.round);
  }

  useEffect(()=>{ load(); },[roundId]);

  useEffect(()=>{
    // restart timer bar each turn
    setTimerKey(k=>k+1);
  },[data?.turn]);

  const currentPlayer = useMemo(()=>{
    if(!data) return null;
    const idx = (data.turn-1) % data.players.length;
    return data.players[idx];
  },[data]);

  async function submit(){
    if(!question.trim()) return;
    setLoading(true);
    try{
      const res = await fetch('/api/round/ask', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ round_id: data.id, player_id: currentPlayer, question })
      });
      const out = await res.json();
      if(!res.ok) throw new Error(out.error||'Failed');
      setQuestion('');
      await load();
    }catch(e){ alert(e.message);}finally{ setLoading(false);}
  }

  async function nextRound(){
    const res = await fetch(`/api/round/${roundId}/next`, { method:'POST' });
    const d = await res.json();
    if(!res.ok) return alert(d.error||'Failed');
    setData(d.round);
    setTimerKey(k=>k+1);
  }

  if(!roundId){
    return (
      <div className="note animate-slideUp">
        <div className="note-inner">
          <div className="text-lg font-semibold">No active round</div>
          <div className="opacity-80 mt-1">Start a new round to begin playing.</div>
          <a className="btn btn-primary mt-3 inline-flex" href="/setup">Go to Setup</a>
        </div>
      </div>
    );
  }

  if(!data) return <div>Loading…</div>;

  return (
    <div className="grid md:grid-cols-[320px,1fr] gap-5">
      {/* Left: secret lock box */}
      <div className="space-y-4">
        <div className="lock">
          <div className="lock-inner">
            <div className="title flex items-center gap-2">
              <span>🔒 Secret Question</span>
              <label className="ml-auto flex items-center gap-2 text-xs opacity-80">
                <input type="checkbox" checked={asQuestioner} onChange={e=> setAsQuestioner(e.target.checked)} />
                View as Questioner
              </label>
            </div>
            <div className="secret secret-wrap">
              {asQuestioner ? (
                <div>
                  <div className="font-semibold">{data.secret_question}</div>
                  <div className="text-xs opacity-75 mt-1">Questioner: {data.questioner_id}</div>
                </div>
              ) : (
                <>
                  <div className="opacity-60">Only the Questioner can see this.</div>
                  <div className="secret-overlay">🔒 Locked</div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="note animate-bob">
          <div className="note-inner">
            <div className="label mb-2">Turn Order</div>
            <div className="queue mb-3">
              {data.players.map((p,idx)=>{
                const active = p===currentPlayer;
                return <span key={p} className={`queue-item ${active? 'active':''}`}>{p}</span>;
              })}
            </div>
            <div className="label mb-1">Asking Now</div>
            <div className="font-semibold">{currentPlayer}</div>
            <div className="timer mt-3"><div key={timerKey} className="timer-bar animate-timerRoll" /></div>
            <div className="mt-3 flex gap-2">
              <input className="input" placeholder="Ask a yes/no question…" value={question} onChange={e=> setQuestion(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') submit(); }} />
              <button className="btn btn-primary" onClick={submit} disabled={loading}>Ask</button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: log and hint */}
      <div className="space-y-4">
        {data.solved && (
          <div className="note animate-slideUp">
            <div className="note-inner">
              <div className="text-lg font-semibold">🎉 Solved by {data.solver_id}</div>
              <div className="mt-2">{data.secret_question}</div>
              <button className="btn btn-secondary mt-4" onClick={nextRound}>Start New Round</button>
            </div>
          </div>
        )}
        {data.solved && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-cork-800/80 backdrop-blur border-t border-white/10">
            <button className="btn btn-primary w-full" onClick={nextRound}>Start New Round</button>
          </div>
        )}

        <div className="note">
          <div className="note-inner space-y-3">
            <div className="label">Ask Log</div>
            <div className="space-y-2">
              {data.log.length===0 && <div className="opacity-60">No questions yet.</div>}
              {data.log.map((l,i)=> (
                <div key={i} className="log-item">
                  <div className="text-sm"><strong>{l.player_id}</strong>: {l.submitted_question}</div>
                  <div className={`text-xs mt-0.5 ${l.matched? 'log-match':'log-miss'}`}>{l.matched? 'Matched':'Not matched'}</div>
                  {l.clue && !l.matched && (
                    <div className="mt-1 text-sm"><strong>Clue:</strong> <em>{l.clue}</em></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

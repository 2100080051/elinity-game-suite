import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';

function Section({title,children}){
  return (
    <div className="card animate-fadeInUp"><div className="card-inner">
      {title && <h2 className="text-xl font-semibold mb-2">{title}</h2>}
      {children}
    </div></div>
  );
}

function Timer({seconds=30, onDone}){
  const [t, setT] = useState(seconds);
  useEffect(()=>{ setT(seconds); }, [seconds]);
  useEffect(()=>{
    const id = setInterval(()=> setT(x=> x>0? x-1:0), 1000);
    return ()=> clearInterval(id);
  },[]);
  useEffect(()=>{ if (t===0 && onDone) onDone(); }, [t,onDone]);
  const pct = Math.round((t/seconds)*100);
  return <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-accent-pink" style={{width:`${pct}%`}}/></div>;
}

export default function Play(){
  const router = useRouter();
  const { id } = router.query;
  const [session, setSession] = useState(null);
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchSnapshot = async (sid)=>{
    const r = await fetch(`/api/session/${sid}`);
    if (r.status===404){
      const s = await fetch('/api/session', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ players: ['You','Partner'] }) });
      const j = await s.json(); router.replace(`/play?id=${j.session?.id}`); return;
    }
    const j = await r.json(); setSession(j.session); setFeedback(j.feedback_markdown||'');
  };

  useEffect(()=>{ if (router.isReady && id) fetchSnapshot(id); }, [router.isReady, id]);

  const submit = async ()=>{
    if (!session) return;
    await Promise.all([
      left ? fetch(`/api/session/${session.id}/submit`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ player_id: session.swap_pair?.[0], text: left }) }) : null,
      right ? fetch(`/api/session/${session.id}/submit`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ player_id: session.swap_pair?.[1], text: right }) }) : null,
    ].filter(Boolean));
  };

  const evaluate = async ()=>{
    if (!session) return;
    setLoading(true);
    const r = await fetch(`/api/session/${session.id}/score`, { method:'POST' });
    const j = await r.json(); setLoading(false);
    if (!r.ok) return alert(j.error||'Failed');
    setSession(j.session); setFeedback(j.feedback_markdown||'');
  };

  const next = async ()=>{
    if (!session) return;
    const r = await fetch(`/api/session/${session.id}/next`, { method:'POST' });
    const j = await r.json(); if (!r.ok) return alert(j.error||'Failed');
    setSession(j.session); setFeedback(''); setLeft(''); setRight('');
  };

  return (
    <div className="space-y-5">
      {!session ? <Section><div>Loading…</div></Section> : (
        <>
          <div className="card"><div className="card-inner">
            <div className="badge">Swap Card</div>
            <div className="mt-2 text-lg">
              {session?.swap_pair?.length===2 ? (
                <>
                  <div>You are now <span className="font-semibold">{session.swap_pair[0]}</span></div>
                  <div>You are now <span className="font-semibold">{session.swap_pair[1]}</span></div>
                </>
              ) : 'Awaiting swap...'}
            </div>
          </div></div>

          <Section title="Scenario Prompt">
            <div className="whitespace-pre-wrap opacity-95">{session.prompt_markdown}</div>
            {session.background_markdown ? (
              <details className="mt-3 opacity-90"><summary className="cursor-pointer">Background</summary>
                <div className="mt-2 whitespace-pre-wrap">{session.background_markdown}</div>
              </details>
            ):null}
          </Section>

          <div className="grid md:grid-cols-2 gap-4">
            <Section title={session.swap_pair?.[0] || 'Player A'}>
              <input className="input w-full" placeholder="1–2 sentences…" value={left} onChange={e=>setLeft(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') submit(); }} />
              <Timer seconds={30} />
            </Section>
            <Section title={session.swap_pair?.[1] || 'Player B'}>
              <input className="input w-full" placeholder="1–2 sentences…" value={right} onChange={e=>setRight(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') submit(); }} />
              <Timer seconds={30} />
            </Section>
          </div>

          <div className="flex gap-3">
            <button className="btn btn-secondary" onClick={submit}>Send</button>
            <button className="btn btn-primary" onClick={evaluate}>Evaluate</button>
            <button className="btn btn-secondary" onClick={next}>Swap Again</button>
            {loading && <div className="opacity-80 animate-pulseSoft">AI Watchdog is thinking…</div>}
          </div>

          {feedback ? (
            <Section title="Scores & Feedback">
              <div className="whitespace-pre-wrap opacity-95">{feedback}</div>
            </Section>
          ): null}
        </>
      )}
    </div>
  );
}

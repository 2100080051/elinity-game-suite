import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

function Bubble({ type='ai', text='', facts=[] }){
  const cls = type==='ai' ? 'bubble bubble-ai' : 'bubble bubble-improv';
  const title = facts?.[0] ? facts[0] : '';
  return <div className={`${cls} my-3`} title={title}>{text}</div>;
}

function RoleDeck({ roles, onClaim }){
  return (
    <div className="deck">
      {roles.map(r=> (
        <div key={r} className="role" onClick={()=>onClaim(r)}>{r}</div>
      ))}
    </div>
  );
}

export default function Play(){
  const router = useRouter();
  const { id } = router.query;
  const [session, setSession] = useState(null);
  const [markdown, setMarkdown] = useState('');
  const [playerId, setPlayerId] = useState('You');
  const [role, setRole] = useState('');
  const [action, setAction] = useState('');
  const [bubbles, setBubbles] = useState([]);
  const [facts, setFacts] = useState([]);
  const [error, setError] = useState('');

  useEffect(()=>{ (async()=>{
    if (!router.isReady) return;
    if (!id) return;
    try{
      const r = await fetch(`/api/session/${id}`);
      if (r.status===404){
        // create if missing
        const s = await fetch('/api/session', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ culture: 'Let AI surprise me' }) });
        const j = await s.json(); if (!s.ok) throw new Error(j.error||'Failed');
        router.replace(`/play?id=${j.id}`);
        return;
      }
      const j = await r.json();
      setSession(j.session); setMarkdown(j.markdown||'');
    }catch(e){ setError(e.message); }
  })(); }, [router.isReady, id]);

  const claim = async (roleName)=>{
    if (!session) return;
    const r = await fetch(`/api/session/${session.id}/role`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ player_id: playerId, role: roleName }) });
    const j = await r.json(); if (!r.ok) return setError(j.error||'Failed to claim');
    setSession(j.session); setRole(roleName);
  };

  const send = async ()=>{
    if (!session || !action) return;
    const r = await fetch(`/api/session/${session.id}/turn`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ player_id: playerId, role, action_text: action }) });
    const j = await r.json(); if (!r.ok) return setError(j.error||'Failed to send');
    setSession(j.session); setMarkdown(j.markdown||''); setFacts(j.session.facts||[]);
    setBubbles(b => [...b, { type:'improv', text: `(${playerId} as ${role||'—'}) ${action}` }, { type:'ai', text: j.ai_response_text, facts: j.session.facts?.slice(-1) }]);
    setAction('');
  };

  return (
    <div>
      {!session ? (
        <div className="subtle">Loading…</div>
      ) : (
        <div className="space-y-5">
          <div className="content-card p-5">
            <h2 className="hook">{session.culture || 'Cultural Exchange'}</h2>
            <div className="mt-3 subtle whitespace-pre-wrap">{markdown}</div>
            <div className="mt-4 flex items-center gap-2">
              <input value={playerId} onChange={e=>setPlayerId(e.target.value)} className="textbox" placeholder="Your name"/>
              <span className="badge">{role||'No role yet'}</span>
            </div>
            <div className="mt-3">
              <RoleDeck roles={(session.roles||[])} onClaim={claim} />
            </div>
          </div>

          <div className="content-card p-4">
            {bubbles.length===0 ? (
              <div className="subtle">Your actions and AI responses will appear here.</div>
            ) : (
              bubbles.map((b,i)=> <Bubble key={i} type={b.type} text={b.text} facts={b.facts}/>)
            )}
          </div>

          <div className="content-card p-4">
            <div className="inputbar">
              <input value={action} onChange={e=>setAction(e.target.value)} className="textbox" placeholder="1–2 sentences… include emoji if you like" onKeyDown={e=>{ if(e.key==='Enter') send(); }} />
              <button className="btn btn-primary" onClick={send}>Send</button>
            </div>
            {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

function useQuery(){
  const router = useRouter();
  return useMemo(()=>{
    const q = Object.create(null); if(!router?.asPath) return q;
    const idx = router.asPath.indexOf('?'); if(idx===-1) return q;
    const sp = new URLSearchParams(router.asPath.slice(idx+1)); sp.forEach((v,k)=>q[k]=v); return q;
  },[router?.asPath]);
}

export default function Summon(){
  const router = useRouter();
  const { sessionId } = router.query || {};
  const query = useQuery();
  const [playerId, setPlayerId] = useState(query.playerId || '');
  const [name, setName] = useState('');
  const [state, setState] = useState(null);
  const [body, setBody] = useState('');
  const [power, setPower] = useState('');
  const [origin, setOrigin] = useState('');
  const [emotion, setEmotion] = useState('');
  const [chosenName, setChosenName] = useState('');
  const [themeInput, setThemeInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function fetchState(){
    if(!sessionId) return;
    try{ const r = await fetch(`/api/state?sessionId=${encodeURIComponent(sessionId)}`); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); setError(''); }
    catch(e){ setError(String(e.message||e)); }
  }
  useEffect(()=>{ if(!sessionId) return; fetchState(); const id = setInterval(fetchState, 1200); return ()=>clearInterval(id); },[sessionId]);

  async function ensureJoined(){
    if(playerId || !sessionId) return; if(!name.trim()) return;
    try{
      const r = await fetch('/api/join', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, name: name.trim()||'Scribe' }) });
      const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Join failed'); setPlayerId(j.playerId);
      router.replace({ pathname: router.pathname, query: { sessionId, playerId: j.playerId } }, undefined, { shallow: true });
    }catch(e){ setError(String(e.message||e)); }
  }

  async function chooseTheme(){
    if(!sessionId) return; setLoading(true);
    try{ const r = await fetch('/api/set_theme', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, theme: themeInput.trim()||undefined }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); setThemeInput(''); }
    catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function submit(){
    if(!sessionId || !playerId) return; const payload = { body, power, origin, emotion };
    try{ const r = await fetch('/api/submit_traits', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, playerId, ...payload }) }); const j = await r.json(); if(!r.ok || !j.ok) throw new Error(j?.error||'Failed'); setBody(''); setPower(''); setOrigin(''); setEmotion(''); fetchState(); }
    catch(e){ setError(String(e.message||e)); }
  }

  async function summon(){
    if(!sessionId) return; setLoading(true);
    try{ const r = await fetch('/api/summon', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); setChosenName(j.name||''); }
    catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  async function saveName(){
    if(!sessionId) return; try{ const r = await fetch('/api/name', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, name: chosenName }) }); const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Failed'); setState(j); }catch(e){ setError(String(e.message||e)); }
  }

  async function addToCodex(){
    if(!sessionId) return; setLoading(true);
    try{ const r = await fetch('/api/add_to_codex', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) }); const j = await r.json(); if(!r.ok || !j.ok) throw new Error(j?.error||'Failed'); fetchState(); }
    catch(e){ setError(String(e.message||e)); } finally{ setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="badge">Session</div>
          <div className="text-lg font-semibold select-all">{sessionId}</div>
          {state?.theme && <div className="badge">Theme: {state.theme}</div>}
          {state?.round && <div className="badge">Round {state.round}</div>}
        </div>
        <div className="flex items-center gap-2">
          <input className="input w-56" placeholder="Set theme (Forest Spirits)" value={themeInput} onChange={e=>setThemeInput(e.target.value)} />
          <button className="btn" onClick={chooseTheme} disabled={loading}>Set Theme</button>
          <button className="btn-primary" onClick={summon} disabled={loading}>🐾 Summon Beast</button>
        </div>
      </div>

      {!playerId && (
        <div className="panel p-4 flex items-center gap-3">
          <div className="text-rune/80">Enter a name to join the circle:</div>
          <input className="input w-64" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" />
          <button className="btn-primary" onClick={ensureJoined} disabled={!name.trim()}>Join</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          <div className="panel p-4">
            <div className="text-rune/70 text-sm">Trait Collection</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <input className="input" placeholder="Describe body" value={body} onChange={e=>setBody(e.target.value)} />
              <input className="input" placeholder="Describe power" value={power} onChange={e=>setPower(e.target.value)} />
              <input className="input" placeholder="Describe origin" value={origin} onChange={e=>setOrigin(e.target.value)} />
              <input className="input" placeholder="Emotion defining nature" value={emotion} onChange={e=>setEmotion(e.target.value)} />
              <button className="btn-primary" onClick={submit} disabled={!playerId}>Submit Traits</button>
            </div>
          </div>

          <div className="panel p-4">
            <div className="text-rune/70 text-sm">Myth Weaver</div>
            {state?.intro ? (
              <div className="mt-2 parchment-text">{state.intro}</div>
            ) : (
              <div className="mt-2 text-rune/60 text-sm">Set a theme to begin the round.</div>
            )}
          </div>

          {state?.beast && (
            <div className="panel p-4 space-y-2">
              <div className="text-rune/70 text-sm">Mythic Beast: {state.name || 'Unnamed'}</div>
              <div className="text-rune/90 font-mystic text-xl">{state.name || '—'}</div>
              <div className="text-rune/80">{state.beast.summary}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                <div><div className="text-rune/60 text-sm">Appearance</div><div>{state.beast.appearance}</div></div>
                <div><div className="text-rune/60 text-sm">Powers</div><div>{state.beast.powers}</div></div>
                <div><div className="text-rune/60 text-sm">Weaknesses</div><div>{state.beast.weaknesses}</div></div>
              </div>
              <div className="mt-2"><div className="text-rune/60 text-sm">Symbolism</div><div>{state.beast.symbolism}</div></div>
              <div className="mt-2"><div className="text-rune/60 text-sm">📜 Lore</div><div className="scroll whitespace-pre-wrap">{state.beast.lore}</div></div>
              <div className="flex items-center gap-2 mt-2">
                <div className="badge">🧿 Rarity: {state.rarity}</div>
                <div className="badge">🪶 Alignment: {state.alignment}</div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <input className="input w-72" placeholder="Name the beast" value={chosenName} onChange={e=>setChosenName(e.target.value)} />
                <button className="btn" onClick={saveName}>✨ Name It</button>
                <button className="btn-primary" onClick={addToCodex}>📜 Add to Codex</button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="panel p-4">
            <div className="text-rune/70 text-sm">Circle of Creators</div>
            <div className="space-y-2 mt-2">
              {(state?.players||[]).map(p=> (
                <div key={p.id} className={`flex items-center justify-between p-2 rounded-lg border border-rune/20 ${p.id===playerId?'bg-white/5':''}`}>
                  <div>{p.name}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-rune/70 text-sm">Submitted Traits</div>
            <div className="space-y-2 mt-2">
              {(state?.traits||[]).map((t,i)=> (
                <div key={i} className="p-2 rounded-lg border border-rune/20">
                  <div className="text-rune/60 text-xs">{state.players.find(p=>p.id===t.playerId)?.name}</div>
                  <div className="text-rune/80 text-sm">Body: {t.body||'-'}</div>
                  <div className="text-rune/80 text-sm">Power: {t.power||'-'}</div>
                  <div className="text-rune/80 text-sm">Origin: {t.origin||'-'}</div>
                  <div className="text-rune/80 text-sm">Emotion: {t.emotion||'-'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <div className="text-rune/70 text-sm">Mythic Codex</div>
            <div className="text-rune/80 mt-1">Entries: {state?.codexCount||0}</div>
            <button className="btn mt-2" onClick={()=>router.push('/summon/codex')}>Open Codex</button>
          </div>
        </div>
      </div>

      {error && (
        <div className="panel p-3 text-sm text-red-300 border-red-500/30">{error}</div>
      )}
    </div>
  );
}

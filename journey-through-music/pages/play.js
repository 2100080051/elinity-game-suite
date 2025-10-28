import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

function ElementDot({ el, palette }) {
  const color = palette[Math.floor((el.size * 10) % palette.length)] || '#7dd3fc';
  const style = {
    position: 'absolute',
    left: `${el.x * 100}%`,
    top: `${el.y * 100}%`,
    width: `${(el.size*40)+6}px`,
    height: `${(el.size*40)+6}px`,
    marginLeft: '-10px',
    marginTop: '-10px',
    borderRadius: '9999px',
    background: color,
    opacity: el.opacity,
    filter: 'blur(1px)',
    boxShadow: `0 0 20px 2px ${color}40`
  };
  return <span style={style} className="animate-floaty" />
}

export default function Play() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const [session, setSession] = useState(null);
  const [busy, setBusy] = useState(false);
  const tickRef = useRef(null);
  const [reflectText, setReflectText] = useState('');
  const [meditate, setMeditate] = useState(false);

  async function load() {
    if (!id) return;
    const res = await fetch(`/api/session/${id}`);
    if (res.ok) setSession(await res.json());
  }

  async function sendTick() {
    if (!id) return;
    const res = await fetch(`/api/session/${id}/tick`, { method: 'POST' });
    if (res.ok) setSession(await res.json());
  }

  async function sendCommand(cmd) {
    if (!id) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/player_choice`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, choice: cmd }) });
      if (res.ok) setSession(await res.json());
    } finally {
      setBusy(false);
    }
  }

  async function toggleMeditation() {
    setMeditate(v => !v);
    await sendCommand(!meditate ? 'meditate_on' : 'meditate_off');
  }

  async function submitReflection() {
    if (!reflectText.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/reflect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, text: reflectText }) });
      if (res.ok) setSession(await res.json());
      setReflectText('');
    } finally { setBusy(false); }
  }

  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    if (!id) return;
    tickRef.current = setInterval(sendTick, 3000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [id]);

  const palette = session?.scene?.palette || ['#7dd3fc','#a5b4fc','#fde68a'];
  const mood = session?.mood || 'calm';
  const moodColor = mood === 'joyful' ? '#f59e0b' : mood === 'melancholy' ? '#6366f1' : mood === 'energetic' ? '#ef4444' : '#7dd3fc';
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Head>
        <title>Play · Journey through Music · elinity</title>
      </Head>
      <div className="grid md:grid-cols-[2fr,1fr] gap-6">
        <div className="panel relative overflow-hidden min-h-[420px]">
          {/* canvas */}
          <div className="absolute inset-0">
            {session?.scene?.elements?.map((el, idx) => (
              <ElementDot key={idx} el={el} palette={palette} />
            ))}
          </div>
          {/* AI Avatar / mood aura */}
          <div className="absolute left-4 top-4 w-10 h-10 rounded-full" style={{background: moodColor, boxShadow: `0 0 24px ${moodColor}88`}}></div>
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/40 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-300">{session?.scene?.title}</div>
                <div className="text-slate-200">{session?.scene?.narration}</div>
              </div>
              <div className="flex items-center gap-2">
                {palette.map((c,i)=> (
                  <span key={i} className="w-4 h-4 rounded-full" style={{background:c}} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="panel p-4">
            <div className="text-sm text-slate-300">Mood</div>
            <div className="text-lg mb-2 capitalize">{mood}</div>
            <div className="text-sm text-slate-300">Playlist</div>
            <div className="break-all text-slate-200">{session?.playlistUrl || 'None'}</div>
            <div className="text-xs text-slate-400 mt-3">powered by elinity ai</div>
          </div>

          <div className="panel p-4 mt-4">
            <div className="text-sm text-slate-300 mb-2">Choices</div>
            <div className="flex flex-wrap gap-2">
              {(session?.scene?.choices || ['Follow the rising beat','Sit by the glowing ridge','Shift to staccato rhythm']).slice(0,3).map(s => (
                <button key={s} disabled={busy} onClick={()=>sendCommand(s)} className="btn">{s}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button onClick={toggleMeditation} className="btn">{meditate ? 'Exit Meditation' : 'Meditation Mode'}</button>
            </div>
          </div>

          <div className="panel p-4 mt-4 text-sm text-slate-400">
            Tip: The scene gently evolves every few seconds. Click suggestions to nudge it.
          </div>

          <div className="panel p-4 mt-4">
            <div className="text-sm text-slate-300 mb-2">Reflect</div>
            <div className="flex gap-2">
              <input value={reflectText} onChange={e=>setReflectText(e.target.value)} placeholder="Share a thought…" className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10" />
              <button disabled={busy} onClick={submitReflection} className="btn">Send</button>
            </div>
          </div>

          <div className="panel p-4 mt-4">
            <div className="text-sm text-slate-300 mb-2">Journey Log</div>
            <ul className="text-slate-300 text-sm space-y-1 max-h-40 overflow-auto">
              {(session?.log || []).slice(-10).map((e,i)=> (
                <li key={i}>• {e.type}{e.choice?`: ${e.choice}`:''}{e.note?`: ${e.note}`:''}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

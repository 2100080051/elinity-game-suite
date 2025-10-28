import { useEffect, useState } from 'react';

export default function Play() {
  const [state, setState] = useState(null);
  const [outcome, setOutcome] = useState('');
  const [choosing, setChoosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function fetchState() {
    const id = localStorage.getItem('symbol_quest_id');
    if (!id) return;
    const res = await fetch(`/api/state?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    setState(data);
  }

  useEffect(() => { fetchState(); }, []);

  async function choose(index) {
    const id = localStorage.getItem('symbol_quest_id');
    if (!id) return;
    setChoosing(true); setOutcome(''); setError('');
    try {
      const res = await fetch('/api/choose', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ id, index }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to choose');
      setOutcome(data.outcome || '');
    } catch (e) {
      setError('The winds are quiet right now. Please try again.');
    } finally {
      setChoosing(false);
    }
  }

  async function onContinue() {
    const id = localStorage.getItem('symbol_quest_id');
    if (!id) return;
    setChoosing(false);
    setError('');
    setOutcome('');
    const res = await fetch('/api/continue', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ id }) });
    const data = await res.json();
    setState(data);
  }

  async function onSave() {
    const id = localStorage.getItem('symbol_quest_id');
    if (!id) return;
    setSaving(true);
    const res = await fetch('/api/save_reflection', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ id }) });
    const data = await res.json();
    setSaving(false);
    setMessage(data.ok ? 'Saved ✨' : (data.error || 'Unable to save.'));
    setTimeout(()=>setMessage(''), 1600);
  }

  if (!state) return <div className="text-white/70">Summoning symbols…</div>;

  if (state.ended) {
    return (
      <div className="space-y-4">
        <div className="panel p-6 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 shadow-rune mb-3">
            <div className="oracle-orb" />
            <div className="text-sm text-white/80">Elinity AI — Final Reflection</div>
          </div>
          <div className="outcome whitespace-pre-line text-xl">{state.finalInsight}</div>
          <div className="pt-4 flex items-center gap-3 justify-center">
            <button className="btn" onClick={()=>location.href='/'}>Replay Journey 🔁</button>
            <button className="btn-primary" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : 'Save Reflection 🧾'}</button>
            {message && <span className="text-white/70 text-sm">{message}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
  <div key={state.current?.text || state.steps} className="scene p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="oracle-orb" />
              <div>
                <h2 className="m-0">Elinity AI — The Oracle</h2>
                <div className="text-xs text-white/60">Guiding through symbols</div>
              </div>
            </div>
            <div className="w-40">
              <div className="progress"><span style={{width: `${Math.min(100, (state.steps/6)*100)}%`}} /></div>
              <div className="text-[10px] text-white/50 mt-1 text-right">step {state.steps} / 6</div>
            </div>
          </div>
          <div className="mt-3 text-white/70 text-sm">Scene</div>
          <p className="whitespace-pre-line">{state.current?.text}</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {state.current?.choices?.map((c, i) => (
              <button key={i} type="button" disabled={Boolean(choosing) || Boolean(outcome)} className="rune relative z-10" onClick={()=>choose(i)}>
                ✧ {c}
              </button>
            ))}
          </div>
          {choosing && <div className="ripple" />}
        </div>

        {(error || outcome) && (
          <div className="outcome">
            {error ? (
              <div className="text-red-300 text-sm">{error}</div>
            ) : (
              <>
                <div className="text-white/70 text-sm mb-1">Outcome — Elinity AI</div>
                <div className="whitespace-pre-line text-lg">{outcome}</div>
                <div className="pt-3">
                  <button className="btn-primary" onClick={onContinue}>Continue →</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <aside className="panel p-6 h-fit">
        <div className="text-white/70 text-sm">Path Taken</div>
        <div className="mt-2 space-y-2">
          {(state.path || []).map((p, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-white/10 bg-white/5">
              <div className="text-xs text-white/50">{idx+1}</div>
              <div className="text-white/80">{p.choice}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

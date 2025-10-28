import { useEffect, useState } from 'react';

export default function Play() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [log, setLog] = useState([]);

  useEffect(() => {
    const start = async () => {
      setLoading(true); setError('');
      try {
        const r = await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Failed to start');
        setSession(j);
        setLog([{ type: 'world', text: j.world_markdown }, { type: 'recap', text: j.recap_markdown }]);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    };
    start();
  }, []);

  const decide = async (accepted, challenge) => {
    if (!session) return;
    setLoading(true); setError('');
    try {
      const action = `${accepted ? 'ACCEPT' : 'DECLINE'}: ${challenge.title}`;
      setLog(l => [...l, { type: 'action', text: action }]);
      const r = await fetch(`/api/sessions/${session.id}/progress`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed to progress');
      setSession(s => ({ ...s, state: j.state, updatedAt: j.updatedAt }));
      setLog(l => [...l, { type: 'narration', text: j.narration_markdown }]);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (loading && !session) return <div className="mx-auto max-w-4xl px-4 py-10"><div className="glass p-6">Starting session…</div></div>;
  if (error && !session) return <div className="mx-auto max-w-4xl px-4 py-10"><div className="glass p-6 text-red-300">{error}</div></div>;
  if (!session) return null;

  const { chapter_title, recap_markdown, world_markdown, challenges = [], allies = [] } = session;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 grid lg:grid-cols-3 gap-6">
      <section className="glass p-6 lg:col-span-2">
        <h2 className="text-2xl font-semibold mb-2">{chapter_title}</h2>
        <details open className="mb-4">
          <summary className="cursor-pointer accent">Recap</summary>
          <div className="opacity-90 mt-2 whitespace-pre-wrap">{recap_markdown}</div>
        </details>
        <div className="opacity-90 mb-4 whitespace-pre-wrap">{world_markdown}</div>

        <h3 className="font-medium accent mb-2">Challenges</h3>
        <div className="grid md:grid-cols-3 gap-3">
          {challenges.map((c) => (
            <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="text-sm opacity-80">{c.difficulty}</div>
              <div className="font-medium mb-1">{c.title}</div>
              <div className="text-sm opacity-80 mb-2">{c.detail}</div>
              <div className="flex gap-2">
                <button onClick={() => decide(true, c)} className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30">Accept</button>
                <button onClick={() => decide(false, c)} className="px-3 py-1 rounded-lg bg-white/10 border border-white/10">Decline</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="glass p-4">
          <h4 className="font-medium accent mb-2">Allies</h4>
          <ul className="space-y-2">
            {allies.map((a, i) => (
              <li key={i} className="bg-white/5 border border-white/10 rounded-lg p-2">
                <div className="font-medium">{a.name}</div>
                <div className="text-sm opacity-80">{a.quirk} • {a.ability}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass p-4">
          <h4 className="font-medium accent mb-2">Session Log</h4>
          <div className="space-y-2 max-h-[50vh] overflow-auto pr-1">
            {log.map((e, i) => (
              <div key={i} className={`text-sm ${e.type === 'action' ? 'opacity-80' : ''} whitespace-pre-wrap`}>
                {e.text}
              </div>
            ))}
          </div>
        </div>
        {error ? <div className="text-sm text-red-300">{error}</div> : null}
        {loading ? <div className="text-sm opacity-80">Thinking…</div> : null}
      </aside>
    </div>
  );
}

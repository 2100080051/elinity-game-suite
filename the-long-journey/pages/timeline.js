import { useEffect, useState } from 'react';

export default function Timeline() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/sessions');
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Failed to load sessions');
        setSessions(j.sessions || []);
      } catch (e) { setError(e.message); }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="glass p-6">
        <h2 className="text-2xl font-semibold mb-4">Timeline</h2>
        {error ? <div className="text-sm text-red-300 mb-2">{error}</div> : null}
        {!sessions.length ? <div className="opacity-80">No sessions yet.</div> : (
          <ul className="space-y-4">
            {sessions.map(s => (
              <li key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Session {s.id}</div>
                  <a href={`/api/sessions/${s.id}`} className="text-sm opacity-80 hover:opacity-100 underline">Snapshot API</a>
                </div>
                <ol className="list-decimal ml-5 space-y-1">
                  {(s.chapters || []).map((c, i) => (
                    <li key={i}>
                      <span className="font-medium">{c.title || `Chapter ${i+1}`}</span>
                      <span className="opacity-80"> — {c.summary?.slice(0, 140) || ''}</span>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

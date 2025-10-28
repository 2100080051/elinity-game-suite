import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');
  const [mood, setMood] = useState('');
  const [situation, setSituation] = useState('');
  const [intention, setIntention] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const sid = window.localStorage.getItem('fortune_sid');
    if (sid) setSessionId(sid);
  }, []);

  async function ensureSession() {
    if (sessionId) return sessionId;
    const res = await fetch('/api/start_session', { method: 'POST' });
    const data = await res.json();
    window.localStorage.setItem('fortune_sid', data.id);
    setSessionId(data.id);
    return data.id;
  }

  async function onReveal(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const sid = await ensureSession();
      const res = await fetch('/api/get_fortune', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ sessionId: sid, mood, situation, intention })
      });
      const data = await res.json();
      // Store last fortune in session storage for the fortune page to read
      sessionStorage.setItem('fortune_last', JSON.stringify(data));
      router.push('/fortune');
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <section className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-wide mb-3">Fortune Teller</h1>
        <p className="text-white/70 max-w-2xl mx-auto">A gentle oracle for your day. Share a little context, and receive a short, uplifting sign to guide your next step.</p>
      </section>

      <form onSubmit={onReveal} className="panel p-6 mx-auto max-w-2xl space-y-4">
        <div>
          <label className="block text-sm text-white/70 mb-1">Mood</label>
          <input value={mood} onChange={e=>setMood(e.target.value)} placeholder="e.g. hopeful, uncertain, energized" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-white/20" />
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1">Situation</label>
          <input value={situation} onChange={e=>setSituation(e.target.value)} placeholder="e.g. big decision, new project, meeting someone" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-white/20" />
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1">Intention</label>
          <input value={intention} onChange={e=>setIntention(e.target.value)} placeholder="e.g. clarity, courage, calm" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-white/20" />
        </div>

        {error && <div className="text-red-300 text-sm">{error}</div>}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-white/60">
            <span className="pulse-dot" />
            <span>Ready when you are</span>
          </div>
          <button disabled={loading} className="btn-gold">
            {loading ? 'Revealing…' : 'Reveal Fortune ✨'}
          </button>
        </div>
      </form>
    </div>
  );
}

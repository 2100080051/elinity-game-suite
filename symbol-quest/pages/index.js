import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function start() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/start_game', { method: 'POST' });
      const data = await res.json();
      localStorage.setItem('symbol_quest_id', data.id);
      router.push('/play');
    } catch (e) {
      setError('Could not start. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="text-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 shadow-rune mb-3 animate-fadeIn">
          <div className="oracle-orb" />
          <div className="text-sm text-white/80">Elinity AI — The Oracle</div>
        </div>
        <h1 className="text-3xl md:text-5xl font-semibold bg-clip-text text-transparent" style={{backgroundImage:'linear-gradient(90deg,#cbd5e1,#f0c674)'}}>
          🜂 Symbol Quest — Journey Through the Realm of Meaning
        </h1>
        <p className="text-white/70 mt-2 max-w-2xl mx-auto">Welcome, seeker. Every step reveals what words cannot. Begin your path through mirrors, bridges, and lantern-lit thresholds.</p>
      </section>

      <div className="grid md:grid-cols-2 gap-6 items-stretch">
        <div className="panel p-6 text-center flex flex-col justify-center">
          <p className="text-white/80">The Oracle awaits with symbols and choices. Ready to begin?</p>
          {error && <div className="text-red-300 text-sm mt-2">{error}</div>}
          <div className="pt-4">
            <button disabled={loading} onClick={start} className="btn-primary">{loading ? 'Summoning…' : 'Begin the Journey ✨'}</button>
          </div>
        </div>
        <div className="panel p-6">
          <div className="text-left text-white/70 text-sm">A glimpse of the realm</div>
          <div className="mt-2 p-4 rounded-lg border border-white/10 bg-white/5">
            <div className="mb-2 text-white/85">“You stand before the Whispering Bridge of Doubt, where mist braids questions into the rope.”</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button disabled className="rune">✧ Step forward</button>
              <button disabled className="rune">✧ Wait and listen</button>
              <button disabled className="rune">✧ Speak your name</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

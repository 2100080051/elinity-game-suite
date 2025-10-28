import { useEffect, useState } from 'react';

export default function Home(){
  const [stats, setStats] = useState({ rounds: 0, recent: [] });
  useEffect(()=>{
    (async ()=>{
      try{
        const r = await fetch('/api/state');
        const d = await r.json();
        setStats({ rounds: d.archive?.length||0, recent: (d.archive||[]).slice(-3).reverse() });
      }catch{}
    })();
  },[]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="panel stage overflow-hidden relative">
        <div className="panel-inner relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-semibold mb-2">
                <span className="brand-mark">Guess the Fake</span>
              </h1>
              <p className="text-white/80 max-w-xl">A breezy ice‑breaker: two truths, one clever lie. Share a seed line, then everyone guesses the fake.</p>
              <div className="mt-4 flex items-center gap-3">
                <a className="btn btn-primary" href="/play">Play Now</a>
                <a className="btn btn-secondary" href="#how">How it works</a>
              </div>
            </div>
            <div className="relative w-full md:w-80 h-40 md:h-48 rounded-2xl bg-gradient-to-br from-lilac-100/20 to-sky-100/20 border border-white/10">
              <div className="absolute inset-0 grid grid-cols-6 opacity-30">
                {Array.from({length:12}).map((_,i)=> (
                  <div key={i} className="animate-pulseSoft" style={{animationDelay: `${i*120}ms`}} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center gap-4 text-3xl">
                <span className="animate-floaty">❖</span>
                <span className="animate-floaty [animation-delay:200ms]">❖</span>
                <span className="animate-floaty [animation-delay:400ms]">❖</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="grid md:grid-cols-3 gap-4">
        {[{t:'Seed',d:'One player types a short anecdote.'},{t:'Reveal',d:'Get two truths and one plausible lie.'},{t:'Guess',d:'Everyone taps the one they think is fake.'}].map((f,i)=> (
          <div key={i} className="panel">
            <div className="panel-inner">
              <div className="text-white/70 text-xs uppercase tracking-wider">Step {i+1}</div>
              <div className="text-xl font-semibold">{f.t}</div>
              <p className="text-white/80 mt-1">{f.d}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Recent */}
      <section className="panel">
        <div className="panel-inner">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Recent Secrets</div>
            <a className="btn btn-ghost" href="/play">Start a round →</a>
          </div>
          <div className="mt-3 grid md:grid-cols-3 gap-3">
            {stats.recent.length===0 && <div className="text-white/70">No rounds yet. Be the first!</div>}
            {stats.recent.map(a=> (
              <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm text-white/70">Player {a.seed.player_id}</div>
                <div className="font-medium truncate">“{a.seed.seed_text}”</div>
                <div className="text-xs text-white/60 mt-1">Lie was #{a.items.correct_index}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

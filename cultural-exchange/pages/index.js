import { useState } from 'react';
import { useRouter } from 'next/router';

const PRESETS = ['Let AI surprise me','Maasai wedding','Japanese tea ceremony','Mexican Day of the Dead','Diwali preparations','Brazilian Festa Junina'];

export default function Home(){
  const [culture, setCulture] = useState(PRESETS[0]);
  const router = useRouter();

  const start = async ()=>{
    const r = await fetch('/api/session', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ culture: culture }) });
    const j = await r.json();
    if (!r.ok) return alert(j.error||'Failed to start');
    router.push(`/play?id=${j.id}`);
  };

  return (
    <div className="relative">
      {/* Hero */}
      <div className="content-card p-6 md:p-8">
        <h1 className="hook animate-fadeInUp">
          Cultural <span className="brand-gradient">Exchange</span>
        </h1>
        <p className="mt-3 subtle max-w-2xl animate-fadeInUp delay-2">
          Explore rituals, myths, and everyday practices through collaborative improv guided by an adaptive AI. Choose a culture—or let fate decide.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center animate-fadeInUp delay-3">
          <select className="select" value={culture} onChange={e=>setCulture(e.target.value)}>
            {PRESETS.map(p=> <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="flex gap-3">
            <button className="btn btn-primary btn-lg" onClick={start}>
              <span className="inline-flex -ml-1 items-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mr-2 opacity-90"><path d="M8 5v14l11-7L8 5z" fill="currentColor"/></svg>
              </span>
              Start Session
            </button>
            <a className="btn btn-secondary btn-lg" href="/play">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mr-2 opacity-90"><path d="M12 8v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/></svg>
              Open Current Session
            </a>
          </div>
        </div>
      </div>

      {/* Floating accents */}
      <div className="pointer-events-none absolute -top-6 -left-6 w-24 h-24 rounded-full bg-indigo-500/20 blur-2xl animate-float" />
      <div className="pointer-events-none absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-amber-400/20 blur-2xl animate-float" style={{animationDelay: '1s'}} />
    </div>
  );
}

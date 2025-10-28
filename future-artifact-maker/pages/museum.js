import { useEffect, useState } from 'react';

export default function Museum() {
  const [artifacts, setArtifacts] = useState([]);

  useEffect(() => {
    // Try server list, fallback to localStorage
    (async () => {
      try {
        const res = await fetch('/api/artifacts');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length) return setArtifacts(data);
        }
      } catch {}
      try {
        const local = JSON.parse(localStorage.getItem('fam:artifacts') || '[]');
        setArtifacts(local);
      } catch {}
    })();
  }, []);

  return (
    <main className="pt-28">
      <section className="max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold heading-gradient">🖼️ Future Museum</h1>
            <p className="text-mist/80 mt-2">Your saved artifacts — titles, art, and meanings.</p>
          </div>
          <a href="/session" className="btn">New Artifact</a>
        </div>

        {artifacts.length === 0 ? (
          <div className="card p-8 mt-6 text-center text-mist/80">No artifacts yet. Create one in a session.</div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
            {artifacts.map(a => (
              <div className="card p-4" key={a.id}>
                <div className="aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10">
                  {a.imageUrl ? <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-mist/60">No image</div>}
                </div>
                <div className="mt-3 text-sm uppercase tracking-wider text-mist/70">Artifact</div>
                <div className="text-white/95 font-semibold">{a.title || a.name}</div>
                {a.reflection && <div className="text-mist/80 text-sm mt-2">“{a.reflection}”</div>}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

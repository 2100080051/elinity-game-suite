import { useEffect, useState } from 'react';

export default function Book() {
  const [legends, setLegends] = useState([]);

  useEffect(() => {
    (async ()=>{
      try { const res = await fetch('/api/legends'); if (res.ok) { const d = await res.json(); if (Array.isArray(d) && d.length) return setLegends(d); } } catch {}
      try { const local = JSON.parse(localStorage.getItem('myth:legends') || '[]'); setLegends(local); } catch {}
    })();
  }, []);

  return (
    <main className="pt-28">
      <section className="max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold heading text-ink">📚 Book of Legends</h1>
            <p className="subtle mt-2">Your archived myths.</p>
          </div>
          <a href="/play" className="btn btn-ember">New Myth</a>
        </div>

        {legends.length === 0 ? (
          <div className="panel p-8 mt-6 text-center text-ink/70">Nothing here yet. Start a myth to archive it.</div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
            {legends.map(L => (
              <div className="panel p-4" key={L.id}>
                <div className="text-sm uppercase tracking-wider text-slate/80">Legend</div>
                <div className="text-ink font-semibold">{L.title}</div>
                <div className="text-ink/70 text-sm mt-2 line-clamp-3">{L.rounds?.[0]?.text || L.climax}</div>
                <div className="mt-3 flex gap-2">
                  <a className="tab" href={`/api/legends/${L.id}`}>Open</a>
                  <button className="tab" onClick={()=> remove(L.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );

  async function remove(id) {
    try { await fetch(`/api/legends/${id}`, { method: 'DELETE' }); } catch {}
    setLegends(legends.filter(x=> x.id!==id));
    try {
      const key = 'myth:legends';
      const arr = JSON.parse(localStorage.getItem(key) || '[]').filter(x=> x.id!==id);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch {}
  }
}

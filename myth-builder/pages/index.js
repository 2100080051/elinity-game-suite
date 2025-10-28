export default function Home() {
  return (
    <main className="pt-28">
      <section className="max-w-6xl mx-auto px-6">
        <div className="banner p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-5xl font-bold heading text-ink">🔮 Myth Builder</h1>
              <p className="mt-3 text-lg subtle">Unite your imagination, forge a legend.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/play" className="btn btn-ember">✨ Begin Myth</a>
                <a href="/play?mode=remix" className="btn btn-ink">🎭 Share & Remix</a>
                <a href="/book" className="btn">📚 My Legends Book</a>
              </div>
            </div>
            <div className="panel p-6">
              <h3 className="text-ink font-semibold">Why it feels epic</h3>
              <ul className="list-disc pl-6 text-slate/90 mt-2">
                <li>Living muse: Elinity AI narrates in real time.</li>
                <li>Fresh worlds each session—no two myths the same.</li>
                <li>Archive legends in your Book for remixing.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

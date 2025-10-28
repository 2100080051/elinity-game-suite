export default function Home() {
  return (
    <main className="pt-28">
      <section className="max-w-5xl mx-auto px-6">
        <div className="hero-border card p-10 md:p-14 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold heading-gradient">🔮 Future Artifact Maker</h1>
          <p className="mt-4 text-lg md:text-xl text-mist/90">
            Imagine what your future holds — and see it come alive.
          </p>
          <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4">
            <a href="/session" className="btn btn-primary">✨ Begin Session</a>
            <a href="/group" className="btn btn-ghost">🎭 Group Play</a>
            <a href="/museum" className="btn">🖼️ View My Future Museum</a>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          <Feature title="Visioning Prompts" desc="Gentle, curious questions to spark your imagination."/>
          <Feature title="Artifact Stories" desc="AI paints your idea as poetic visuals and meaning."/>
          <Feature title="Future Museum" desc="Collect, revisit, and share your artifacts."/>
        </div>
      </section>
    </main>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white/90">{title}</h3>
      <p className="mt-2 text-sm text-mist/80">{desc}</p>
    </div>
  );
}

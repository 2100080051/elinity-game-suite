export default function Home(){
  return (
    <div className="relative">
      <div className="note animate-slideUp">
        <div className="note-inner">
          <h1 className="text-3xl md:text-4xl font-semibold">The Hidden Question</h1>
          <p className="mt-2 text-white/80 max-w-2xl">A fast‑paced deduction game: one secret questioner, everyone else asks yes/no questions to tease out the hidden query. Solve it before the hints give it away.</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a className="btn btn-primary" href="/setup">Start</a>
            <a className="btn btn-secondary" href="/play">Jump to Live</a>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mt-6">
        <div className="note"><div className="note-inner">
          <div className="label">1. Secret</div>
          <div className="mt-1">AI assigns a secret question to a random Questioner.</div>
        </div></div>
        <div className="note"><div className="note-inner">
          <div className="label">2. Ask</div>
          <div className="mt-1">Players queue up with yes/no questions; the timer pushes the pace.</div>
        </div></div>
        <div className="note"><div className="note-inner">
          <div className="label">3. Reveal</div>
          <div className="mt-1">When someone nails it, celebrate and start the next round.</div>
        </div></div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <section className="text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">🗝️ AI Escape Room</h1>
        <p className="mt-3 text-lg opacity-80">Co‑op Puzzle‑Solving</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <a href="/room" className="glass px-6 py-3">Create Room</a>
          <a href="/join" className="glass px-6 py-3">Join Room</a>
          <a href="/rooms" className="glass px-6 py-3">Saved Plays</a>
        </div>
      </section>
      <section className="mt-16 grid md:grid-cols-3 gap-6">
        <div className="panel">
          <h3 className="font-semibold text-xl">Scenario</h3>
          <p className="opacity-80 mt-2">Immersive locked‑room setting with a dynamic plot hook.</p>
        </div>
        <div className="panel">
          <h3 className="font-semibold text-xl">Clues & Hints</h3>
          <p className="opacity-80 mt-2">Single‑line clues, gradual hints—adjusted to your team’s pace.</p>
        </div>
        <div className="panel">
          <h3 className="font-semibold text-xl">Timer & Points</h3>
          <p className="opacity-80 mt-2">Race the clock. Earn clue points. Escape in style.</p>
        </div>
      </section>
    </div>
  );
}

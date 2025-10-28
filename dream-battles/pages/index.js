export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <section className="text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          ✨ Dream Battles
        </h1>
        <p className="mt-4 text-lg opacity-80">
          Turn your dreams into epic arenas.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <a href="/duel" className="glass px-6 py-3">Start Duel</a>
          <a href="/leaderboard" className="glass px-6 py-3">View Leaderboard</a>
          <a href="/how" className="glass px-6 py-3">How to Play</a>
        </div>
      </section>
      <section className="mt-16 grid md:grid-cols-3 gap-6">
        <div className="glass p-6">
          <h3 className="font-semibold text-xl">Dream Entry</h3>
          <p className="opacity-80 mt-2">Describe a fragment—shape, color, emotion, or a short narrative.</p>
        </div>
        <div className="glass p-6">
          <h3 className="font-semibold text-xl">Visual Card</h3>
          <p className="opacity-80 mt-2">AI forges an illustrated battle card with a surreal arena.</p>
        </div>
        <div className="glass p-6">
          <h3 className="font-semibold text-xl">Duel & Score</h3>
          <p className="opacity-80 mt-2">Cards clash. Elinity AI narrates and awards Dream Points.</p>
        </div>
      </section>
    </div>
  );
}

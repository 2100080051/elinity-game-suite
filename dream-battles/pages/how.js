export default function How() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">How to Play</h1>
      <div className="mt-6 glass p-6 space-y-4">
        <p>Play by dreaming up fragments—one‑line descriptions of shapes, colors, emotions, or short narratives. The AI turns each fragment into a richly illustrated battle card.</p>
        <ol className="list-decimal list-inside space-y-2 opacity-90">
          <li>Enter a dream fragment (≤20 words).</li>
          <li>AI generates a title, arena description, and an image thumbnail (if an image provider is configured).</li>
          <li>Collect cards in your deck, then pick two to duel.</li>
          <li>Elinity AI narrates the clash in 80–120 words and declares a winner.</li>
          <li>Winner earns 1 Dream Point. Leaderboard updates live.</li>
        </ol>
        <p className="opacity-80">Remix dreams anytime to twist the arena and spark new outcomes.</p>
      </div>
    </div>
  );
}

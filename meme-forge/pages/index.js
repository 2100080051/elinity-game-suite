export default function Home(){
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="card p-10 text-center">
        <h1 className="text-4xl font-bold mb-3">Meme Forge</h1>
        <p className="opacity-85 mb-6">A quick-fire, collaborative meme-creation game. Get a fresh prompt, add captions, and vote on the funniest meme. Infinite replayability for breaks and parties.</p>
        <div className="flex items-center justify-center gap-4">
          <a className="btn" href="/play">Enter Meme Forge</a>
          <a className="btn-ghost" href="/play">Skip Intro</a>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="card p-4">
          <div className="font-medium mb-1">Prompt → Caption → Meme</div>
          <div className="text-sm opacity-80">AI gives an image idea + seed. You add the punchline. We render the meme.</div>
        </div>
        <div className="card p-4">
          <div className="font-medium mb-1">Vote in 30 seconds</div>
          <div className="text-sm opacity-80">Tap ▲/▼ during the timer. We tally and spotlight the winner.</div>
        </div>
        <div className="card p-4">
          <div className="font-medium mb-1">Loop forever</div>
          <div className="text-sm opacity-80">Hit Next Meme for a brand-new prompt and keep the laughs going.</div>
        </div>
      </div>
    </div>
  );
}

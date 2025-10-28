export default function Home(){
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="card p-10 text-center">
        <h1 className="text-4xl font-bold mb-3">Life Goals Board Game</h1>
        <p className="opacity-85 mb-6">Design and explore your personal or group objectives on a dynamic board. Roll, land, name your Goal Space, describe your plan, and let Elinity AI sketch the journey.</p>
        <div className="flex items-center justify-center gap-4">
          <a className="btn" href="/play">Start Playing</a>
          <a className="btn-ghost" href="/play">Quick Start</a>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="card p-4">
          <div className="font-medium mb-1">Regenerating board</div>
          <div className="text-sm opacity-80">A 5×5 grid of blank Goal Spaces each session—endless replay.</div>
        </div>
        <div className="card p-4">
          <div className="font-medium mb-1">Roll → Share → Journey</div>
          <div className="text-sm opacity-80">Roll a die, land on a space, explain your plan; AI returns a journey map.</div>
        </div>
        <div className="card p-4">
          <div className="font-medium mb-1">Celebrate progress</div>
          <div className="text-sm opacity-80">Mark inspiring spaces and start a new round anytime.</div>
        </div>
      </div>
    </div>
  );
}

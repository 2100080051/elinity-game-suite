export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <section className="glass p-8 md:p-10">
        <h1 className="text-3xl md:text-4xl font-semibold mb-3">The Long Journey</h1>
        <p className="opacity-80 mb-6">Begin an epic, serialized adventure guided by Elinity AI. Each chapter brings a new world, challenges, and allies. Your choices shape the path.</p>
        <div className="flex gap-4">
          <a href="/play" className="px-5 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition">Start Chapter</a>
          <a href="/timeline" className="px-5 py-2 rounded-xl bg-white/10 border border-white/10">Timeline</a>
        </div>
      </section>
      <section className="mt-8 grid md:grid-cols-3 gap-4">
        <div className="glass p-4">
          <h3 className="font-medium mb-1 accent">Epic, but bite-sized</h3>
          <p className="opacity-80 text-sm">Chapters are concise and vivid—perfect for weekly play.</p>
        </div>
        <div className="glass p-4">
          <h3 className="font-medium mb-1 accent">Choices that matter</h3>
          <p className="opacity-80 text-sm">Accept or decline challenges, befriend allies, shape the theme.</p>
        </div>
        <div className="glass p-4">
          <h3 className="font-medium mb-1 accent">Exportable state</h3>
          <p className="opacity-80 text-sm">APIs return strict JSON so you can integrate anywhere.</p>
        </div>
      </section>
    </div>
  );
}

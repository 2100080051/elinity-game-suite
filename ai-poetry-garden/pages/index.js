export default function Home(){
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="poem overflow-hidden relative">
        <div className="poem-inner relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-semibold mb-2">AI Poetry Garden</h1>
              <p className="text-white/80 max-w-xl">Plant a seed line. Nurture it into a short poem and a gentle visual. Your blooms live on in the archive—return anytime to grow the garden.</p>
              <div className="mt-4 flex items-center gap-3">
                <a className="btn btn-primary" href="/garden">Enter Garden</a>
                <a className="btn btn-secondary" href="#how">How it works</a>
              </div>
            </div>
            <div className="relative w-full md:w-80 h-40 md:h-48 rounded-2xl bg-gradient-to-br from-leaf-400/20 to-blossom-400/15 border border-white/10">
              {/* Pixel hills */}
              <div className="absolute inset-x-0 bottom-0 h-1/2" style={{
                backgroundImage: 'linear-gradient(0deg, rgba(34,197,94,.14) 8px, transparent 8px), linear-gradient(90deg, rgba(34,197,94,.14) 8px, transparent 8px)',
                backgroundSize: '16px 16px'
              }} />
              <div className="absolute left-6 bottom-6 text-3xl animate-bounce [animation-duration:2.8s]">🌱</div>
              <div className="absolute left-12 bottom-10 text-2xl animate-bounce [animation-duration:3.2s]">🌸</div>
              <div className="absolute right-8 bottom-8 text-2xl animate-bounce [animation-duration:3s]">🌼</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how" className="grid md:grid-cols-3 gap-4">
        {[{
          title:'Plant',
          desc:'Add one heartfelt line. That’s your seed.'
        },{
          title:'Grow',
          desc:'We sprout a 4–8 line poem and a visual cue.'
        },{
          title:'Archive',
          desc:'Your blooms join a serene, living collection.'
        }].map((f,i)=> (
          <div key={i} className="poem">
            <div className="poem-inner">
              <div className="label text-white/70">Step {i+1}</div>
              <div className="text-xl font-semibold">{f.title}</div>
              <p className="mt-1 text-white/80">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

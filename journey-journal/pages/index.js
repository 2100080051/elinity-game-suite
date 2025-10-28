import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [chapters, setChapters] = useState([]);
  const [chapterNum, setChapterNum] = useState(1);
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [prompts, setPrompts] = useState([]);
  const [players, setPlayers] = useState([{ name: 'Writer A', text: '' }, { name: 'Writer B', text: '' }]);
  const [summary, setSummary] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | writing | summarized
  const [showPast, setShowPast] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { loadChapters(); }, []);
  useEffect(() => { setChapterNum((chapters?.length || 0) + 1); }, [chapters]);

  async function loadChapters() {
    try {
      const res = await axios.get('/api/chapters');
      setChapters(res.data?.chapters || []);
    } catch {}
  }

  async function startChapter() {
    setBusy(true);
    try {
      const res = await axios.post('/api/journey', {
        action: 'start',
        prev: chapters.slice(-2),
        chapterNum
      });
      const data = res.data || {};
      setTitle(data.title || `Chapter ${chapterNum}: The Journey Continues`);
      setIntro(data.intro || 'A gentle wind carries new thoughts across the page.');
      setPrompts(data.prompts || [
        'What moment this week made you pause and feel grateful?',
        'If your current mood were a landscape, how would it look?'
      ]);
      setSummary('');
      setPhase('writing');
    } finally { setBusy(false); }
  }

  async function summarize() {
    setBusy(true);
    try {
      const entries = players.filter(p=>p.text?.trim()).map(p => ({ player: p.name, text: p.text.trim() }));
      const res = await axios.post('/api/journey', {
        action: 'summarize',
        chapterNum,
        title,
        intro,
        prompts,
        entries,
        prev: chapters.slice(-3),
      });
      const data = res.data || {};
      setSummary(data.summary || 'The ink dries softly. Their reflections settle into a calm current.');
      setPhase('summarized');
    } finally { setBusy(false); }
  }

  async function saveChapter() {
    const payload = {
      chapterNum,
      title,
      intro,
      prompts,
      entries: players.map(p=>({ player: p.name, text: p.text })),
      summary,
      timestamp: new Date().toISOString(),
    };
    await axios.post('/api/chapters', payload);
    await loadChapters();
    // reset
    setPlayers(ps => ps.map(p=>({ ...p, text: '' })));
    setTitle(''); setIntro(''); setPrompts([]); setSummary('');
    setPhase('idle');
  }

  const addPlayer = () => setPlayers(ps => [...ps, { name: `Writer ${String.fromCharCode(65 + ps.length)}`, text: '' }]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-deepblue">
          <span>📖 Journey Journal</span> — Write Your Shared Story
        </h1>
        <p className="text-deepblue/80 max-w-2xl mx-auto">A calm, ongoing story you write together with gentle guidance from ElinityAI.</p>
      </header>

      {/* Chapter header and controls */}
      <div className="paper p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-deepblue/70">Current Chapter</div>
          <div className="text-2xl font-bold h-ink">{title || `Chapter ${chapterNum}: The Beginning of the Journey`}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={startChapter} className="px-3 py-2 rounded-lg border border-forest/30 bg-forest/10 text-forest hover:bg-forest/15">Next Chapter</button>
          <button onClick={saveChapter} disabled={!summary} className="px-3 py-2 rounded-lg border border-gold/30 bg-gold/10 text-deepblue hover:bg-gold/20 disabled:opacity-50">Save Chapter</button>
          <button onClick={()=>setShowPast(v=>!v)} className="px-3 py-2 rounded-lg border border-deepblue/20 bg-white/50 hover:bg-white">{showPast? 'Hide' : 'View'} Past Chapters</button>
        </div>
      </div>

      {showPast && (
        <div className="paper p-5 h-page">
          <div className="text-sm text-deepblue/70 mb-2">Past Chapters ({chapters.length})</div>
          <ul className="space-y-3 max-h-[30vh] overflow-y-auto pr-2">
            {chapters.map((c,i)=> (
              <li key={i} className="border border-deepblue/10 rounded-lg p-3 bg-white/60">
                <div className="font-semibold">{c.title}</div>
                <div className="text-sm text-deepblue/80">{new Date(c.timestamp).toLocaleString()}</div>
                <div className="mt-1 text-deepblue/90">{c.summary}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Intro and prompts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="paper p-5 space-y-2">
            <div className="text-sm text-deepblue/70">AI Intro</div>
            <div className="text-deepblue/90 h-ink min-h-[48px]">{intro || 'Welcome, travelers. This living journal begins its first lines…'}</div>
          </div>
          <div className="paper p-5 space-y-2">
            <div className="text-sm text-deepblue/70">Prompts</div>
            {prompts?.length>0 ? (
              <ul className="list-disc list-inside text-deepblue/90 space-y-1">
                {prompts.map((p,i)=>(<li key={i}>{p}</li>))}
              </ul>
            ) : (
              <div className="text-deepblue/70">Click Next Chapter to receive fresh prompts.</div>
            )}
          </div>

          <div className="paper p-5 space-y-3">
            <div className="text-sm text-deepblue/70">Journal Entries</div>
            {players.map((pl, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  className="px-3 py-2 rounded-lg bg-white/70 border border-deepblue/10 md:col-span-1"
                  value={pl.name}
                  onChange={e=>setPlayers(ps=>ps.map((p,i)=> i===idx?{...p, name:e.target.value}:p))}
                />
                <textarea
                  className="px-3 py-2 rounded-lg bg-white/70 border border-deepblue/10 md:col-span-2 min-h-[90px]"
                  placeholder="Write 1–2 paragraphs from your week…"
                  value={pl.text}
                  onChange={e=>setPlayers(ps=>ps.map((p,i)=> i===idx?{...p, text:e.target.value}:p))}
                />
              </div>
            ))}
            <button onClick={addPlayer} className="px-3 py-2 rounded-lg border border-deepblue/20 bg-white/60 hover:bg-white">+ Add Writer</button>

            <div className="pt-2">
              <button onClick={summarize} disabled={!prompts.length} className="px-4 py-2 rounded-lg border border-deepblue/20 bg-deepblue/10 text-deepblue hover:bg-deepblue/20 disabled:opacity-50">Summarize Chapter</button>
              {busy && <span className="ml-3 text-sm text-deepblue/70">Thinking…</span>}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="paper p-5 h-page">
            <div className="text-sm text-deepblue/70 mb-1">AI Reflection Output</div>
            {summary ? (
              <div className="text-deepblue/90 whitespace-pre-wrap">{summary}</div>
            ) : (
              <div className="text-deepblue/70">Your poetic chapter summary will appear here after you click Summarize.</div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}

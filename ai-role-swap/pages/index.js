import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

const initialNames = { a: 'Player A', b: 'Player B' };

export default function Home() {
  const [phase, setPhase] = useState('intro'); // intro | scenario | roleplay | reflection | summary
  const [playerNames, setPlayerNames] = useState(initialNames);
  const [scenario, setScenario] = useState('');
  const [messages, setMessages] = useState([]); // {role:'A'|'B', content:string}
  const [commentary, setCommentary] = useState([]); // AI twists and notes
  const [active, setActive] = useState('A');
  const [input, setInput] = useState('');
  const [reflection, setReflection] = useState(null);
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);

  const transcriptForApi = useMemo(() => {
    return messages.map(m => ({ role: m.role === 'A' ? playerNames.a : playerNames.b, content: m.content }));
  }, [messages, playerNames]);

  const api = async (action) => {
    setBusy(true);
    try {
      const res = await axios.post('/api/role_swap', {
        action,
        playerNames,
        scenario,
        transcript: transcriptForApi,
      });
      return res.data;
    } catch (err) {
      console.error(err);
      return { error: 'Network error' };
    } finally {
      setBusy(false);
    }
  };

  const startScenario = async () => {
    const data = await api('scenario');
    if (data?.scenario) {
      setScenario(data.scenario);
      if (data.guidance) setCommentary(c => [...c, { type: 'guidance', text: data.guidance }]);
      setPhase('roleplay');
    }
  };

  const nextTwist = async () => {
    const data = await api('twist');
    if (data?.twist) setCommentary(c => [...c, { type: 'twist', text: data.twist }]);
    if (data?.nudge) setCommentary(c => [...c, { type: 'nudge', text: data.nudge }]);
  };

  const endRound = async () => {
    const data = await api('reflect');
    if (data?.questions || data?.insights) {
      setReflection({ questions: data.questions || [], insights: data.insights || [] });
      setPhase('reflection');
    }
  };

  const endGame = async () => {
    const data = await api('summary');
    setSummary(data || null);
    setPhase('summary');
  };

  const addLine = () => {
    if (!input.trim()) return;
    setMessages(ms => [...ms, { role: active, content: input.trim() }]);
    setInput('');
  };

  const resetAll = () => {
    setPhase('scenario');
    setScenario('');
    setMessages([]);
    setCommentary([]);
    setReflection(null);
    setSummary(null);
  };

  useEffect(() => {
    if (phase === 'intro') {
      // auto show scenario panel ready
      setPhase('scenario');
    }
  }, [phase]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          <span className="text-electric">🎭 AI Role Swap</span> — Step Into Each Other’s Shoes
        </h1>
        <p className="text-slate-300 max-w-2xl mx-auto">
          Take turns pretending to be each other while ElinityAI directs the scene with twists and reflections.
        </p>
      </header>

      {/* Names */}
      <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(['a','b']).map(key => (
          <label key={key} className="block">
            <span className="text-sm text-slate-300">{key === 'a' ? 'Player A' : 'Player B'} Name</span>
            <input className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-electric/50" value={playerNames[key]} onChange={e=>setPlayerNames(n=>({...n,[key]:e.target.value}))} />
          </label>
        ))}
      </div>

      {/* Scenario & Controls */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="text-sm text-slate-400 mb-2">Scenario</div>
            {scenario ? (
              <div className="text-xl font-semibold spotlight">{scenario}</div>
            ) : (
              <div className="text-slate-400">Click Start New Scenario to begin.</div>
            )}
          </div>

          {/* Chat / Roleplay */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <button className={`px-3 py-1 rounded-full border ${active==='A'?'border-electric/70 bg-electric/20':'border-white/10 bg-white/5'}`} onClick={()=>setActive('A')}>
                {playerNames.a}
              </button>
              <button className={`px-3 py-1 rounded-full border ${active==='B'?'border-coral/70 bg-coral/20':'border-white/10 bg-white/5'}`} onClick={()=>setActive('B')}>
                {playerNames.b}
              </button>
            </div>
            <div className="max-h-[40vh] overflow-y-auto space-y-3 pr-2">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role==='A'?'justify-start':'justify-end'}`}>
                  <div className={`bubble ${m.role==='A'?'bubble-a':'bubble-b'}`}>
                    <div className="text-xs opacity-70 mb-1">{m.role==='A'?playerNames.a:playerNames.b} as the other</div>
                    {m.content}
                  </div>
                </div>
              ))}
              {commentary.map((c, i) => (
                <div key={`c-${i}`} className="flex justify-center">
                  <div className={`bubble bubble-ai wobble`}>
                    <div className="text-xs opacity-70 mb-1">ElinityAI {c.type === 'twist' ? 'twist' : c.type}</div>
                    {c.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-electric/50"
                placeholder={`Type as ${active==='A'?playerNames.b:playerNames.a}…`}
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter') addLine(); }}
                disabled={!scenario}
              />
              <button onClick={addLine} disabled={!scenario || !input.trim()} className="px-4 py-2 rounded-lg bg-electric/20 border border-electric/40 hover:bg-electric/30 disabled:opacity-50">Add Line</button>
            </div>
          </div>
        </div>

        {/* AI Commentary & Controls */}
        <aside className="space-y-4">
          <div className="card p-5 space-y-3">
            <div className="text-sm text-slate-400">AI Director</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={startScenario} className="px-3 py-2 rounded-lg border border-lemon/40 bg-lemon/20 hover:bg-lemon/30">Start New Scenario</button>
              <button onClick={nextTwist} disabled={!scenario || busy} className="px-3 py-2 rounded-lg border border-electric/40 bg-electric/20 hover:bg-electric/30 disabled:opacity-50">Next Twist</button>
              <button onClick={endRound} disabled={!scenario || busy} className="px-3 py-2 rounded-lg border border-coral/40 bg-coral/20 hover:bg-coral/30 disabled:opacity-50">End Round</button>
            </div>
            {busy && <div className="text-xs text-slate-400">Thinking…</div>}
          </div>

          {phase==='reflection' && reflection && (
            <div className="card p-5 fade-in space-y-3">
              <div className="text-sm text-slate-400">Reflection</div>
              {reflection.insights?.length>0 && (
                <ul className="list-disc list-inside text-slate-200/90 space-y-1">
                  {reflection.insights.map((t,i)=>(<li key={i}>{t}</li>))}
                </ul>
              )}
              {reflection.questions?.length>0 && (
                <div className="text-slate-300 mt-2">
                  {reflection.questions.join(' ')}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={resetAll} className="px-3 py-2 rounded-lg border border-lemon/40 bg-lemon/20 hover:bg-lemon/30">Start New Scenario</button>
                <button onClick={endGame} className="px-3 py-2 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20">End Game</button>
              </div>
            </div>
          )}

          {phase==='summary' && summary && (
            <div className="card p-5 fade-in space-y-3">
              <div className="text-sm text-slate-400">Game Summary</div>
              {summary.funniest?.length>0 && (
                <div>
                  <div className="font-semibold mb-1">Funniest moments</div>
                  <ul className="list-disc list-inside space-y-1">{summary.funniest.map((s,i)=>(<li key={i}>{s}</li>))}</ul>
                </div>
              )}
              {summary.insights?.length>0 && (
                <div>
                  <div className="font-semibold mb-1">Insights</div>
                  <ul className="list-disc list-inside space-y-1">{summary.insights.map((s,i)=>(<li key={i}>{s}</li>))}</ul>
                </div>
              )}
              {summary.closing && <div className="text-slate-300">{summary.closing}</div>}
              <div className="pt-2">
                <button onClick={()=>{ setPhase('scenario'); setSummary(null); setScenario(''); setMessages([]); setCommentary([]); }} className="px-3 py-2 rounded-lg border border-lemon/40 bg-lemon/20 hover:bg-lemon/30">Start Another</button>
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

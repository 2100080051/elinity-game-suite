import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [config, setConfig] = useState({ theme: 'dream world', style: 'story', rules: ['Emotions power machines'] });
  const [stateText, setStateText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]); // timeline of states
  const [mode, setMode] = useState('action'); // action | describe | change
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  // load saved sandbox if any
  useEffect(() => { loadState(); }, []);

  async function applyRules() {
    setBusy(true);
    try {
      const res = await axios.post('/api/sandbox', { action: 'setup', config });
      const data = res.data || {};
      setHistory(h => [...h, { type: 'setup', text: data.summary || 'Setup confirmed.' }]);
    } finally { setBusy(false); }
  }

  async function startSimulation() {
    setBusy(true);
    try {
      const res = await axios.post('/api/sandbox', { action: 'init', config });
      const data = res.data || {};
      const text = data.state || 'The sandbox awakens.';
      setStateText(text);
      setSuggestions(data.suggestions || []);
      setHistory(h => [...h, { type: 'state', text }]);
    } finally { setBusy(false); }
  }

  async function evolve(actionText) {
    if (!stateText) return;
    setBusy(true);
    try {
      const res = await axios.post('/api/sandbox', { action: 'evolve', config, state: stateText, directive: actionText || input });
      const data = res.data || {};
      const text = data.state || stateText;
      setStateText(text);
      setSuggestions(data.suggestions || []);
      setHistory(h => [...h, { type: 'state', text }]);
      setInput('');
    } finally { setBusy(false); }
  }

  async function changeRule(ruleText) {
    setBusy(true);
    try {
      const res = await axios.post('/api/sandbox', { action: 'change_rule', config, state: stateText, rule: ruleText || input });
      const data = res.data || {};
      const text = data.state || stateText;
      setStateText(text);
      setSuggestions(data.suggestions || []);
      setHistory(h => [...h, { type: 'rule', text: data.note || `Rule changed: ${ruleText || input}` }, { type: 'state', text }]);
      setInput('');
    } finally { setBusy(false); }
  }

  async function describe() {
    setBusy(true);
    try {
      const res = await axios.post('/api/sandbox', { action: 'describe', config, state: stateText, query: input });
      const data = res.data || {};
      if (data.description) setHistory(h => [...h, { type: 'describe', text: data.description }]);
      setInput('');
    } finally { setBusy(false); }
  }

  async function saveState() {
    const payload = { config, state: stateText, suggestions, history, timestamp: new Date().toISOString() };
    await axios.post('/api/state', payload);
  }
  async function loadState() {
    try {
      const res = await axios.get('/api/state');
      const s = res.data || {};
      if (s?.state) { setConfig(s.config || config); setStateText(s.state); setSuggestions(s.suggestions || []); setHistory(s.history || []); }
    } catch {}
  }
  async function restart() {
    setConfig({ theme: '', style: 'story', rules: [] });
    setStateText(''); setSuggestions([]); setHistory([]); setInput('');
  }

  const quickActions = useMemo(()=>[
    { label: 'Evolve', onClick: ()=> evolve('Evolve the current scene in a surprising but coherent way.') },
    { label: 'Add Rule', onClick: ()=> setMode('change') },
    { label: 'Summarize', onClick: async ()=>{ setBusy(true); try{ const res = await axios.post('/api/sandbox',{ action:'summarize', config, state: stateText, history }); const d = res.data||{}; setHistory(h=>[...h,{type:'summary', text:d.summary||'Sandbox summarized.'}]); } finally{ setBusy(false);} } },
  ], [config, stateText, history]);

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Top heading and quick controls */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            <span className="heading-gradient">🧪 The AI Sandbox</span> — Creative Rule-Based Simulation
          </h1>
          <p className="text-slate-300 max-w-3xl">Define the rules of your world. Evolve it with actions. Change the laws mid-stream. There is no failure — only evolution.</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <button className="btn btn-ghost" onClick={saveState}>💾 Save</button>
          <button className="btn btn-ghost" onClick={loadState}>📂 Load</button>
          <button className="btn btn-ghost" onClick={restart}>🔄 Restart</button>
        </div>
      </header>

      {/* Main grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Rules & Controls */}
        <aside className="space-y-4 lg:col-span-1 lg:sticky lg:top-6 self-start">
          <div className="glass p-5 space-y-4">
            <div className="section-title">Rule Composer</div>

            <label className="block">
              <div className="text-xs text-slate-400">Theme</div>
              <input className="mt-1 input" value={config.theme} onChange={e=>setConfig(c=>({...c, theme:e.target.value}))} placeholder="e.g., dream world" />
            </label>

            <label className="block">
              <div className="text-xs text-slate-400">Style</div>
              <select className="mt-1 select" value={config.style} onChange={e=>setConfig(c=>({...c, style:e.target.value}))}>
                <option value="story">Story-driven</option>
                <option value="visual">Visual</option>
                <option value="game">Game-like</option>
              </select>
            </label>

            <div>
              <div className="text-xs text-slate-400 mb-1">Core Rules</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {config.rules.map((r,i)=>(
                  <span key={i} className="chip">
                    {r}
                    <button className="text-xs opacity-70 hover:opacity-100" onClick={()=>setConfig(c=>({...c, rules: c.rules.filter((_,idx)=>idx!==i)}))}>✕</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="flex-1 input" placeholder="Add new rule" value={input} onChange={e=>setInput(e.target.value)} />
                <button className="btn btn-ghost" onClick={()=>{ if(input.trim()){ setConfig(c=>({...c, rules:[...c.rules, input.trim()]})); setInput(''); } }}>＋ Add Rule</button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button className="btn btn-primary" onClick={applyRules}>Apply Rules</button>
              <button className="btn btn-primary" onClick={startSimulation}>Start Simulation</button>
              <button className="btn btn-ghost" onClick={saveState}>Save Sandbox State</button>
              <button className="btn btn-ghost" onClick={loadState}>Load Previous Session</button>
              <button className="btn btn-ghost" onClick={restart}>Restart Simulation</button>
            </div>
          </div>
        </aside>

        {/* Center: Sandbox Visualization */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass p-6 space-y-3">
            <div className="section-title">Current State</div>
            {stateText ? (
              <div className="typewriter whitespace-pre-wrap">{stateText}</div>
            ) : (
              <div className="text-slate-400">Start the simulation to see your world awaken.</div>
            )}
          </div>

          <div className="glass p-6 space-y-3">
            <div className="section-title">Suggested Evolutions</div>
            {suggestions?.length>0 ? (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s,i)=>(<button key={i} className="btn-chip" onClick={()=>evolve(s)}>{s}</button>))}
              </div>
            ) : (
              <div className="text-slate-400">No suggestions yet. Try an action below.</div>
            )}
          </div>

          <div className="glass p-6 space-y-3">
            <div className="section-title">Timeline</div>
            <ul className="timeline">
              {history.map((h,i)=>(<li key={i} className="timeline-item"><span className="text-slate-500 mr-2">[{h.type}]</span> {h.text}</li>))}
            </ul>
          </div>
        </div>
      </section>

      {/* Bottom: Interaction Console */}
      <div className="glass p-6 space-y-3">
        <div className="section-title">Interaction Console</div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="select" value={mode} onChange={e=>setMode(e.target.value)}>
            <option value="action">Action</option>
            <option value="describe">Describe</option>
            <option value="change">Change Rule</option>
          </select>
          <input className="flex-1 input" placeholder={mode==='action'? 'E.g., Expand forest' : mode==='describe'? 'Describe outcome...' : 'E.g., Gravity works in reverse'} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ if(mode==='action') evolve(); else if(mode==='describe') describe(); else if(mode==='change') changeRule(); } }} />
          {mode==='action' && <button className="btn btn-primary" onClick={()=>evolve()}>Send Action</button>}
          {mode==='describe' && <button className="btn btn-primary" onClick={describe}>Describe</button>}
          {mode==='change' && <button className="btn btn-primary" onClick={changeRule}>Apply Rule Change</button>}
          {busy && <span className="text-sm text-slate-400">Thinking…</span>}
          {quickActions.map((q,i)=>(<button key={i} className="btn btn-ghost" onClick={q.onClick}>{q.label}</button>))}
        </div>
      </div>
    </main>
  );
}

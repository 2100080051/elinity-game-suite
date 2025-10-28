import { useEffect, useState } from 'react';

export default function Fortune() {
  const [fortune, setFortune] = useState(null);
  const [question, setQuestion] = useState('');
  const [insight, setInsight] = useState('');
  const [saving, setSaving] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('fortune_last');
    if (raw) {
      try { setFortune(JSON.parse(raw)); } catch {}
    }
  }, []);

  async function askOracle() {
    if (!fortune?.sessionId && !localStorage.getItem('fortune_sid')) return;
    setInsight('');
    const sid = localStorage.getItem('fortune_sid');
    const res = await fetch('/api/interpret_fortune', {
      method: 'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ sessionId: sid, reflection: question })
    });
    const data = await res.json();
    setInsight(data.text);
  }

  async function saveScroll() {
    const sid = localStorage.getItem('fortune_sid');
    if (!sid) return;
    setSaving(true);
    try {
      await fetch('/api/save_fortune', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ sessionId: sid }) });
    } finally {
      setSaving(false);
    }
  }

  async function copyFortune() {
    try {
      await navigator.clipboard.writeText(fortune?.text || '');
      setCopyMsg('Copied!');
      setTimeout(()=>setCopyMsg(''), 1500);
    } catch {}
  }

  async function loadHistory() {
    const sid = localStorage.getItem('fortune_sid');
    if (!sid) return;
    const res = await fetch(`/api/get_history?sessionId=${encodeURIComponent(sid)}`);
    const data = await res.json();
    setHistory(data.history || []);
  }

  useEffect(() => { if (showHistory) loadHistory(); }, [showHistory]);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <div className="panel p-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="crystal" />
            <div>
              <div className="text-lg font-medium">Your Fortune</div>
              <div className="text-xs text-white/60">Unrolled just for now</div>
            </div>
          </div>
          <div className="scroll">
            <div className="whitespace-pre-line leading-relaxed text-lg">
              {fortune?.text?.split('\n').map((line, i) => (
                <div key={i} className="line">{line}</div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4 items-center">
            <button className="btn" onClick={()=>location.href='/'}>Another Fortune 🔁</button>
            <button className="btn" disabled={saving} onClick={saveScroll}>{saving ? 'Saving…' : 'Save Scroll 🧾'}</button>
            <button className="btn" onClick={copyFortune}>Copy 📋</button>
            <button className="btn" onClick={()=>setShowHistory(v=>!v)}>{showHistory ? 'Hide History' : 'History 📜'}</button>
            {copyMsg && <span className="text-white/70 text-sm">{copyMsg}</span>}
          </div>
        </div>

        <div className="panel p-6">
          <div className="text-lg font-medium mb-2">Ask the Oracle</div>
          <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="e.g. How might I apply this today?" className="w-full min-h-[88px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-white/20" />
          <div className="pt-3 flex items-center justify-between">
            <div className="text-white/60 text-sm">Short and kind guidance will appear</div>
            <button className="btn-gold" onClick={askOracle}>Ask ✨</button>
          </div>
          {insight && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-white/70 text-sm">Oracle says:</div>
              <div className="mt-1 whitespace-pre-line">{insight}</div>
            </div>
          )}
        </div>
      </div>

      <aside className="panel p-6 h-fit">
        <div className="text-lg font-medium mb-3">Saved Scrolls</div>
        {!showHistory && (
          <button className="btn w-full" onClick={()=>setShowHistory(true)}>Load history</button>
        )}
        {showHistory && (
          <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
            {history.length === 0 && <div className="text-white/60 text-sm">No saved fortunes yet.</div>}
            {history.map(h => (
              <div key={h.id} className="p-3 bg-white/5 rounded border border-white/10">
                <div className="text-xs text-white/50">{new Date(h.createdAt).toLocaleString()}</div>
                <div className="mt-1 whitespace-pre-line">{h.text}</div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react'

const defaultPlayers = [{ name: 'You' }]

export default function Home() {
  const [stage, setStage] = useState('start') // start | setup | play | results
  const [players, setPlayers] = useState(defaultPlayers)
  const [rounds, setRounds] = useState(3)
  const [currentRound, setCurrentRound] = useState(1)
  const [narrative, setNarrative] = useState(null)
  const [assignedLife, setAssignedLife] = useState(null)
  const [response, setResponse] = useState('')
  const [scores, setScores] = useState({ creativity: 0, realism: 0, empathy: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [journalSaved, setJournalSaved] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)
  const [journalEntries, setJournalEntries] = useState([])
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (stage === 'play' && !assignedLife) {
      handleAssign()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  const canNextRound = useMemo(() => currentRound < rounds, [currentRound, rounds])

  async function callLifeAPI(action, payload) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/life', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'API error')
      return data
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleAssign() {
    const data = await callLifeAPI('assign', { preferences: {} })
    if (data) {
      setAssignedLife(data.life)
      setNarrative(data.narrative || null)
    }
  }

  async function handleScenario() {
    const data = await callLifeAPI('scenario', { life: assignedLife })
    if (data) setNarrative(data.narrative)
  }

  async function handleReactSubmit() {
    if (!response.trim()) return
    const data = await callLifeAPI('react', { life: assignedLife, response })
    if (data) {
      setNarrative(data.narrative)
      setScores(data.score || scores)
      setResponse('')
    }
  }

  async function handleSummaryAndSave() {
    const data = await callLifeAPI('summary', { life: assignedLife })
    if (!data) return
    const entry = {
      date: new Date().toISOString(),
      round: currentRound,
      life: assignedLife,
      summary: data.summary,
      scores
    }
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      })
      if (!res.ok) throw new Error('Failed to save journal')
      setJournalSaved(true)
      setToast('Saved to journal')
      setTimeout(() => setToast(''), 2500)
    } catch (e) {
      setError(e.message)
    }
  }

  async function openJournal() {
    try {
      const res = await fetch('/api/journal')
      const data = await res.json()
      setJournalEntries(Array.isArray(data) ? data.reverse() : [])
      setJournalOpen(true)
    } catch (e) {
      setJournalEntries([])
      setJournalOpen(true)
    }
  }

  function resetRound() {
    setNarrative(null)
    setAssignedLife(null)
    setScores({ creativity: 0, realism: 0, empathy: 0, total: 0 })
    setResponse('')
    setJournalSaved(false)
  }

  function nextRoundOrFinish() {
    if (canNextRound) {
      setCurrentRound((r) => r + 1)
      resetRound()
    } else {
      setStage('results')
    }
  }

  return (
    <div className="space-y-6">
      {stage === 'play' && (
        <div className="play-status">
          <div className="container py-2 flex items-center justify-between">
            <div className="text-xs sm:text-sm text-slate-700">Round {currentRound} of {rounds}</div>
            <div className="w-40 hidden sm:block">
              <div className="play-progress"><div className="play-progress-fill" style={{ width: `${Math.round((currentRound-1)/(rounds||1)*100)}%` }} /></div>
            </div>
          </div>
        </div>
      )}
      {stage === 'start' && (
        <div className="relative overflow-hidden">
          <div className="card card-gradient">
            <div className="grid lg:grid-cols-2 gap-6 items-center">
              <div>
                <h1 className="section-title">Life Swap Simulator</h1>
                <p className="mt-3 text-slate-700 max-w-prose">Step into a brand-new life crafted by AI. Roleplay through moments, make choices, and see how your story scores across creativity, realism, and empathy.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="btn-primary" onClick={() => setStage('setup')}>Start</button>
                  <button className="btn-outline" onClick={openJournal}>View Journal</button>
                  <a className="btn-outline" href="#how" onClick={(e) => { e.preventDefault(); alert('How to Play: 1) Start 2) Assign Life 3) React to scenario 4) Save to journal 5) Next round.'); }}>How to Play</a>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                  <span className="badge">Creativity</span>
                  <span className="badge">Realism</span>
                  <span className="badge">Empathy</span>
                </div>
              </div>
              <div className="relative h-48 sm:h-64 lg:h-72">
                <DecorativeHero />
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === 'setup' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="section-title">Players</h2>
            <div className="mt-4 space-y-3">
              {players.map((p, idx) => (
                <div className="flex gap-2" key={idx}>
                  <input className="input" value={p.name} onChange={(e) => {
                    const copy = [...players]; copy[idx].name = e.target.value; setPlayers(copy)
                  }} placeholder={`Player ${idx + 1} name`} />
                  {players.length > 1 && (
                    <button className="btn-outline" onClick={() => setPlayers(players.filter((_, i) => i !== idx))}>Remove</button>
                  )}
                </div>
              ))}
              <button className="btn-secondary" onClick={() => setPlayers([...players, { name: `Player ${players.length + 1}` }])}>+ Add Player</button>
            </div>
          </div>
          <div className="card">
            <h2 className="section-title">Game Settings</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm text-slate-600">Rounds</label>
                <input type="number" min={1} max={10} className="input mt-1 w-24" value={rounds} onChange={(e) => setRounds(parseInt(e.target.value || '1'))} />
              </div>
              <div className="flex gap-3">
                <button className="btn-primary" onClick={() => setStage('play')}>Begin</button>
                <button className="btn-outline" onClick={() => setStage('start')}>Back</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === 'play' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="section-title">Round {currentRound} of {rounds}</h2>
              <div className="badge">{players.length} Player{players.length > 1 ? 's' : ''}</div>
            </div>

            {!assignedLife && (
              <div className="mt-6">
                <button className="btn-primary" disabled={loading} onClick={handleAssign}>Assign New Life</button>
              </div>
            )}

            {assignedLife && (
              <div className="mt-4 space-y-3">
                <div className="glass p-4 fade-in-up">
                  <div className="text-sm text-slate-500">Your Life</div>
                  <div className="mt-1 font-semibold">{assignedLife.title}</div>
                  <div className="text-slate-700 dropcap">{assignedLife.backstory}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(assignedLife.traits || []).map((t, i) => <span key={i} className="badge">{t}</span>)}
                  </div>
                </div>

                <div className="glass p-4 fade-in-up">
                  <div className="text-sm text-slate-500">Narration</div>
                  <div className="mt-1 whitespace-pre-wrap dropcap">{narrative || 'Click "Scenario" to begin your first moment.'}</div>
                  <div className="mt-3 flex gap-2">
                    <button className="btn-outline" disabled={loading} onClick={handleScenario}>{loading ? <span className="spinner"/> : 'Scenario'}</button>
                    <button className="btn-outline" disabled={loading} onClick={() => setNarrative(null)}>Clear</button>
                  </div>
                </div>

                <div className="glass p-4 fade-in-up">
                  <div className="text-sm text-slate-500">Your Response</div>
                  <textarea className="textarea mt-1" value={response} onChange={(e) => setResponse(e.target.value)} placeholder="How do you respond as this person?" />
                  <div className="mt-3 flex gap-2">
                    <button className="btn-primary" disabled={loading || !response.trim()} onClick={handleReactSubmit}>{loading ? <span className="spinner"/> : 'Submit Response'}</button>
                  </div>
                </div>

                <div className="glass p-4 fade-in-up">
                  <div className="text-sm text-slate-500">Scores</div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Score value={scores.creativity} label="Creativity" color="from-pink-500 to-amber-500" />
                    <Score value={scores.realism} label="Realism" color="from-emerald-500 to-teal-500" />
                    <Score value={scores.empathy} label="Empathy" color="from-violet-500 to-indigo-500" />
                    <Score value={scores.total} label="Total" color="from-amber-600 to-pink-600" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <Meter label="Creativity" value={scores.creativity} color="from-pink-500 to-amber-500" />
                    <Meter label="Realism" value={scores.realism} color="from-emerald-500 to-teal-500" />
                    <Meter label="Empathy" value={scores.empathy} color="from-violet-500 to-indigo-500" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="btn-secondary" disabled={loading} onClick={handleSummaryAndSave}>{journalSaved ? 'Saved!' : 'Save to Journal'}</button>
                  <button className="btn-primary" disabled={loading} onClick={nextRoundOrFinish}>{canNextRound ? 'Next Round' : 'Finish'}</button>
                  <button className="btn-outline" onClick={openJournal}>Open Journal</button>
                </div>
              </div>
            )}

            {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-800">Quick Tips</h3>
            <div className="ornament mt-2"><span className="diamond" /></div>
            <ul className="mt-2 list-disc pl-5 text-slate-700 text-sm space-y-1">
              <li>Write in first-person to deepen empathy.</li>
              <li>Ground your choices in reality but keep them imaginative.</li>
              <li>Use details from your assigned life’s backstory and traits.</li>
            </ul>
          </div>
        </div>
      )}

      {stage === 'results' && (
        <div className="card">
          <h2 className="section-title">Session Complete</h2>
          <p className="mt-2 text-slate-700">Nice run! Open the journal to reflect on your choices and outcomes across all rounds.</p>
          <div className="mt-4 flex gap-2">
            <a className="btn-outline" href="/api/journal">View Journal (raw)</a>
            <button className="btn-primary" onClick={() => { setStage('start'); setCurrentRound(1); resetRound(); }}>Play Again</button>
          </div>
        </div>
      )}
      {journalOpen && (
        <JournalModal entries={journalEntries} onClose={() => setJournalOpen(false)} />
      )}
      {!!toast && (
        <div className="toast-wrap">
          <div className="toast">{toast}</div>
        </div>
      )}
    </div>
  )
}

function Score({ value = 0, label, color }) {
  return (
    <div className="p-3 rounded-xl border border-white/40 bg-gradient-to-br from-white/80 to-white/60">
      <div className={`text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${color}`}>{Math.round(value)}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  )
}

function Meter({ label, value = 0, color }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / 10) * 100)))
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="meter mt-1">
        <div className={`meter-fill bg-gradient-to-r ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function DecorativeHero() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 glass rounded-3xl" />
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-gradient-to-br from-amber-400 to-pink-400 blur-2xl opacity-60" />
      <div className="absolute -bottom-6 -left-4 w-44 h-44 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 blur-2xl opacity-60" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-slate-700 text-center text-sm">
          Ready to inhabit a new life?
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-white/60 shadow">AI Powered</div>
        </div>
      </div>
    </div>
  )
}

function JournalModal({ entries, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-w-3xl w-full glass p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Journal</h3>
          <button className="btn-outline" onClick={onClose}>Close</button>
        </div>
        {entries.length === 0 && (
          <div className="mt-4 text-slate-600 text-sm">No entries yet.</div>
        )}
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-auto pr-1">
          {entries.map((e, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/60 bg-white/70">
              <div className="text-xs text-slate-500">{new Date(e.date).toLocaleString()} • Round {e.round}</div>
              <div className="font-semibold mt-1">{e?.life?.title}</div>
              <div className="text-slate-700">{e?.summary}</div>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><span className="font-semibold">Creativity:</span> {Math.round(e?.scores?.creativity || 0)}</div>
                <div><span className="font-semibold">Realism:</span> {Math.round(e?.scores?.realism || 0)}</div>
                <div><span className="font-semibold">Empathy:</span> {Math.round(e?.scores?.empathy || 0)}</div>
                <div><span className="font-semibold">Total:</span> {Math.round(e?.scores?.total || 0)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

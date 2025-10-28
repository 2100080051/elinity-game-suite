import { useEffect, useMemo, useRef, useState } from 'react'

export default function Home(){
  const [stage, setStage] = useState('home') // home | compose | voting
  const [prompt, setPrompt] = useState('')
  const [lines, setLines] = useState([]) // {role:'player'|'ai', text}
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [votes, setVotes] = useState({}) // idx -> {beauty, funny, creative}

  const poemDone = useMemo(() => lines.length >= 6, [lines])
  const canvasRef = useRef(null)
  useEffect(()=> { canvasRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' }) }, [lines])

  async function api(action, payload){
    setLoading(true)
    try{
      const res = await fetch('/api/poem', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, payload }) })
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || 'API error')
      return data
    }catch(e){ console.error(e); return null } finally{ setLoading(false) }
  }

  async function newPrompt(){
    const d = await api('prompt')
    if(d?.prompt){ setPrompt(d.prompt); setStage('compose'); setLines([]); setVotes({}) }
  }

  async function submitLine(){
    if(!input.trim()) return
    const text = input.trim()
    setInput('')
    setLines(ls => [...ls, { role:'player', text }])
    const shouldAI = (lines.length+1) % 2 === 0 // every 2 lines
    if(shouldAI && lines.length+1 < 7){
      const d = await api('ai_line', { prompt, soFar: [...lines, { role:'player', text }] })
      if(d?.line){ setLines(ls => [...ls, { role:'ai', text: d.line }]) }
    }
  }

  async function finishPoem(){
    if(lines.length < 6){ setLines(ls => [...ls, { role:'ai', text: '— The poem wishes for a few more breaths.' }]); return }
    const d = await api('recite', { prompt, lines })
    if(d?.finale){ setLines(ls => [...ls, { role:'ai', text: d.finale }]) }
    setStage('voting')
  }

  function vote(idx, type){ setVotes(v => { const cur = v[idx] || { beauty:0, funny:0, creative:0 }; cur[type] = (cur[type]||0)+1; return { ...v, [idx]: cur } }) }

  return (
    <div className="space-y-6">
      {showRules && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Rules">
          <div className="modal-card">
            <div className="font-display text-xl text-ink">📜 Rules</div>
            <div className="mt-2 text-white/80">
              1) I’ll give a whimsical prompt. 2) You add lines; I chime in sometimes. 3) At ~6–8 lines we vote: 🩷 beautiful, 😂 funniest, 🌟 most creative.
            </div>
            <div className="mt-3 flex justify-end"><button className="btn-ghost" onClick={()=> setShowRules(false)}>Close</button></div>
          </div>
        </div>
      )}

      {stage === 'home' && (
        <div className="panel panel-ring">
          <h1 className="title">🪶 Epic Poem Duel</h1>
          <p className="subtitle mt-1">Compose together in a luminous studio — swift lines, bold imagery, shared applause.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={newPrompt}>{loading? 'Loading…':'🎭 Start Duel'}</button>
            <button className="btn-soft" onClick={newPrompt}>🎲 Random Prompt</button>
            <button className="btn-ghost" onClick={()=> setShowRules(true)}>📜 Rules</button>
          </div>
        </div>
      )}

      {stage === 'compose' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 steps">
            <div className={`step ${stage==='compose' ? 'active' : ''}`}>Compose</div>
            <div className="text-white/30">→</div>
            <div className={`step ${stage==='voting' ? 'active' : ''}`}>Vote</div>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="panel panel-ring">
              <div className="text-xs text-white/60">Prompt</div>
              <div className="mt-1 font-display text-ink text-lg">{prompt}</div>
              <div className="mt-4 text-xs text-white/60">Poem</div>
              <div ref={canvasRef} className="canvas mt-1">
                {lines.map((l,i)=> (
                  <div key={i} className={`line ${l.role==='ai' ? 'ai' : 'player'}`}>
                    <span className="bubble">{l.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel panel-ring flex flex-col">
              <div className="text-xs text-white/60">Compose</div>
              <div className="mt-2 flex gap-2">
                <input className="input flex-1" placeholder="Your next line…" value={input} onChange={e=> setInput(e.target.value)} onKeyDown={e=> { if(e.key==='Enter') submitLine() }} />
                <button className="btn-primary" onClick={submitLine}>Submit</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="badge">Tip: Vary rhythm</span>
                <span className="badge">Use concrete images</span>
                <span className="badge">Leave room for surprise</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="btn-soft" onClick={finishPoem}>{poemDone ? 'Finish & Vote' : 'End Early'}</button>
                <button className="btn-ghost" onClick={()=> setStage('home')}>Back</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === 'voting' && (
        <div className="space-y-4">
          <div className="panel panel-ring">
            <div className="text-xs text-white/60">Final Poem</div>
            <div className="mt-2 space-y-2">
              {lines.map((l,i)=> (
                <div key={i} className={`line ${l.role==='ai' ? 'ai' : 'player'}`}>
                  <span className="bubble">{l.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel panel-ring">
            <div className="text-xs text-white/60">Vote</div>
            <div className="mt-2 grid sm:grid-cols-3 gap-2">
              {lines.map((_,i)=> (
                <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-2">
                  <div className="text-xs text-white/70">Line {i+1}</div>
                  <div className="mt-1 flex gap-2">
                    <button className="btn-ghost" onClick={()=> vote(i,'beauty')}>🩷</button>
                    <button className="btn-ghost" onClick={()=> vote(i,'funny')}>😂</button>
                    <button className="btn-ghost" onClick={()=> vote(i,'creative')}>🌟</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn-primary" onClick={()=> alert(summaryVotes(votes))}>Announce Winner</button>
              <button className="btn-soft" onClick={newPrompt}>Next Round</button>
              <button className="btn-ghost" onClick={()=> setStage('home')}>Back Home</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function summaryVotes(v){
  const totals = {}
  for(const [idx, cats] of Object.entries(v)){
    const t = (cats.beauty||0)+(cats.funny||0)+(cats.creative||0)
    totals[idx] = t
  }
  const entries = Object.entries(totals).sort((a,b)=> b[1]-a[1])
  if(!entries.length) return 'No votes yet — the muse waits.'
  const [topIdx, topScore] = entries[0]
  return `Winner: Line ${Number(topIdx)+1} with ${topScore} votes. Every line sang in its own light — bravo!`
}

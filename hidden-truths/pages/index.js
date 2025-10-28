import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DEFAULT_QUESTIONS = [
  "What small act makes you feel most alive?",
  "What dream have you never told anyone?",
  "If you could relive one day, which would it be?",
  "Which place feels like a secret home to you?",
]

export default function Home(){
  const [stage, setStage] = useState('title') // title | setup | question | guessing | reveal
  const [showHow, setShowHow] = useState(false)
  const [players, setPlayers] = useState([{ name: 'You', avatar: '🫶' }])
  const [question, setQuestion] = useState('')
  const [answers, setAnswers] = useState({}) // name -> text
  const [encoded, setEncoded] = useState([]) // {id, type, text, for: name}
  const [order, setOrder] = useState([]) // shuffled ids
  const [guesses, setGuesses] = useState({}) // id -> playerName
  const [revealIdx, setRevealIdx] = useState(0)
  const [timerOn, setTimerOn] = useState(false)
  const [timeLeft, setTimeLeft] = useState(45)
  const [loading, setLoading] = useState(false)

  const canStartEncode = useMemo(() => players.every(p => (answers[p.name]||'').trim().length >= 3), [players, answers])

  useEffect(() => { if(stage === 'guessing' && timerOn){ const t = setInterval(()=> setTimeLeft(s=> s>0? s-1 : 0), 1000); return ()=> clearInterval(t) } }, [stage, timerOn])

  const AVATARS = ['✨','🦊','🪽','🪄','🌙','🧚','🦢','🪷','🌀','🫶','🐚','🕊️','🌸','🦄']
  function randomAvatar(){ return AVATARS[Math.floor(Math.random()*AVATARS.length)] }
  function addPlayer(){ setPlayers(p => [...p, { name: `Player ${p.length+1}`, avatar: randomAvatar() }]) }
  function updatePlayer(i, key, val){ setPlayers(p => { const c=[...p]; c[i] = { ...c[i], [key]: val }; return c }) }
  function removePlayer(i){ setPlayers(p => p.filter((_,idx)=> idx!==i)) }

  async function getQuestion(){
    setLoading(true)
    try{
      const res = await fetch('/api/hidden', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'question' }) })
      const data = await res.json()
      if(res.ok && data?.question){ setQuestion(data.question) }
      else{ setQuestion(DEFAULT_QUESTIONS[Math.floor(Math.random()*DEFAULT_QUESTIONS.length)]) }
      setStage('question')
    }catch{
      setQuestion(DEFAULT_QUESTIONS[Math.floor(Math.random()*DEFAULT_QUESTIONS.length)])
      setStage('question')
    }finally{ setLoading(false) }
  }

  async function encodeTruths(){
    if(!canStartEncode) return
    setLoading(true)
    try{
      const payload = { players: players.map(p=>p.name), answers }
      const res = await fetch('/api/hidden', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'encode', payload }) })
      const data = await res.json()
      if(res.ok && Array.isArray(data.items)){
        setEncoded(data.items)
        const ids = data.items.map(x=>x.id)
        setOrder(shuffle(ids))
        setGuesses({})
        setStage('guessing')
        setTimeLeft(45)
      }
    }finally{ setLoading(false) }
  }

  async function revealAll(){
    setStage('reveal'); setRevealIdx(0)
  }

  function shuffle(arr){ const a = [...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }
  function typeIcon(t){ return t === 'Riddle' ? '🧩' : t === 'Short Poem' ? '🖋️' : '🎨' }

  return (
    <div className="space-y-6">
      {showHow && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="How It Works">
          <div className="modal-card">
            <div className="divider mb-2"><span className="ornament">✧ HOW IT WORKS ✧</span></div>
            <div className="oracle space-y-2">
              <p>1) I ask a thoughtful question.</p>
              <p>2) Each player answers privately.</p>
              <p>3) I veil each truth as a riddle, poem, or art prompt.</p>
              <p>4) You guess whose truth is whose.</p>
              <p>5) We reveal gently, with warmth and applause.</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="btn-ghost" onClick={()=> setShowHow(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {stage === 'title' && (
        <motion.div className="card fog text-center" initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{duration:0.4}}>
          <h1 className="title-xl">🌙 Hidden Truths</h1>
          <p className="subtitle mt-1 oracle">Reveal what’s hidden — through riddles, art, and intuition.</p>
          <div className="mt-3 divider"><span className="ornament">✦</span></div>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button className="btn-primary" onClick={()=> setStage('setup')}>Start Game</button>
            <button className="btn-ghost" onClick={()=> setShowHow(true)}>How It Works</button>
            <button className="btn-ghost" onClick={()=> setStage('setup')}>Start New Round</button>
          </div>
        </motion.div>
      )}

      {stage === 'setup' && (
        <motion.div className="card" initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{duration:0.35}}>
          <div className="text-white/80 font-semibold mb-2">Players</div>
          <div className="space-y-2">
            {players.map((p,i)=> (
              <motion.div key={i} className="flex gap-2 items-center" initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} transition={{delay: i*0.05}}>
                <input className="input w-24" value={p.avatar} onChange={e=>updatePlayer(i,'avatar',e.target.value)} />
                <button className="btn-ghost" onClick={()=> updatePlayer(i,'avatar', randomAvatar())}>Random</button>
                <input className="input flex-1" placeholder={`Player ${i+1} name`} value={p.name} onChange={e=>updatePlayer(i,'name',e.target.value)} />
                <button className="btn-ghost" onClick={()=>removePlayer(i)}>Remove</button>
              </motion.div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={addPlayer}>+ Add Player</button>
          </div>
          <div className="mt-5 flex justify-center">
            <button className="btn-primary" onClick={getQuestion}>{loading ? 'Loading…' : 'Begin Round'}</button>
          </div>
        </motion.div>
      )}

      {stage === 'question' && (
        <div className="card fade-in">
          <div className="text-sm text-white/70">The Oracle asks</div>
          <div className="mt-1 font-display text-xl oracle">{question}</div>
          <div className="mt-4">
            <PrivacyEntry players={players} answers={answers} setAnswers={setAnswers} />
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn-primary" onClick={encodeTruths} disabled={!canStartEncode || loading}>{loading ? 'Encoding…' : 'Continue: Disguise Truths'}</button>
            <button className="btn-ghost" onClick={()=> setStage('title')}>Back</button>
          </div>
        </div>
      )}

      {stage === 'guessing' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/70">Mysteries</div>
                <div className="text-white/90 oracle">Guess whose truth belongs to whom.</div>
              </div>
              <div className="flex flex-col items-end gap-2 text-sm min-w-[160px]">
                <label className="flex items-center gap-2"><input type="checkbox" checked={timerOn} onChange={e=> { setTimerOn(e.target.checked); setTimeLeft(45) }} /> Timer</label>
                {timerOn && (
                  <div className="w-40 timer" title={`${timeLeft}s`}>
                    <span style={{ width: `${Math.max(0, Math.min(100, (timeLeft/45)*100))}%` }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {order.map(id => {
              const item = encoded.find(x=>x.id===id)
              return (
                <motion.div key={id} className="truth relative" initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} transition={{duration:0.3}}>
                  <div className="truth-type flex items-center gap-2">
                    <span className="truth-icon" aria-hidden>{typeIcon(item.type)}</span>
                    {item.type}
                  </div>
                  <div className="mt-1 whitespace-pre-line oracle">{item.text}</div>
                  <div className="mt-3">
                    <div className="text-sm text-white/70 mb-1">Guess:</div>
                    <div className="tokens">
                      {players.map(p => {
                        const sel = guesses[id] === p.name
                        return (
                          <div key={p.name} className={`token ${sel ? 'selected' : ''}`} onClick={()=> setGuesses(g => ({...g, [id]: p.name}))}>
                            <span className="avatar">{p.avatar}</span>
                            <span>{p.name}</span>
                            {sel && <span aria-hidden>✧</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="card">
            <div className="flex gap-2">
              <button className="btn-primary btn-reveal" onClick={revealAll}>Reveal Truths ✨</button>
              <button className="btn-ghost" onClick={()=> setStage('title')}>End Round</button>
            </div>
          </div>
        </div>
      )}

      {stage === 'reveal' && (
        <div className="space-y-4">
          <Confetti />
          {encoded.map((item, i) => (
            <motion.div key={item.id} className="card" initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} transition={{duration:0.3, delay: i*0.03}}>
              <div className="truth-type">{item.type}</div>
              <div className="mt-1 whitespace-pre-line oracle">{item.text}</div>
              <div className="mt-3">
                <RevealLine item={item} guess={guesses[item.id]} />
              </div>
            </motion.div>
          ))}
          <Scores players={players} encoded={encoded} guesses={guesses} />
          <div className="flex gap-2">
            <button className="btn-primary" onClick={()=> { setAnswers({}); setEncoded([]); setOrder([]); setGuesses({}); getQuestion() }}>Next Question</button>
            <button className="btn-ghost" onClick={()=> setStage('title')}>End Game</button>
          </div>
        </div>
      )}
    </div>
  )
}

function PrivacyEntry({ players, answers, setAnswers }){
  const [idx, setIdx] = useState(0)
  const current = players[idx]
  const [text, setText] = useState('')
  const [mask, setMask] = useState(true)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => { setText(answers[current.name] || '') }, [idx])

  function save(){
    setAnswers(a => ({ ...a, [current.name]: text }));
    setSavedFlash(true); setTimeout(()=> setSavedFlash(false), 900)
    if(idx < players.length-1) setIdx(idx+1)
  }

  return (
    <div className="relative">
      {mask && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/70">
          <div className="card max-w-md text-center">
            <div className="text-white/80">Privacy Mode</div>
            <div className="mt-1">Only <span className="font-semibold">{current.avatar} {current.name}</span> should view the screen.</div>
            <button className="btn-primary mt-3" onClick={()=> setMask(false)}>I am {current.name} →</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="text-sm text-white/70">Now answering</div>
        <div className="mt-1 text-lg">{current.avatar} {current.name}</div>
        <textarea className="textarea mt-3" placeholder="Type your answer here…" value={text} onChange={e=> setText(e.target.value)} />
        <div className="mt-3 flex gap-2 items-center">
          <button className="btn-primary" onClick={save}>{savedFlash ? '✨ Hidden safely' : 'Save Answer'}</button>
          {idx < players.length-1 && <button className="btn-ghost" onClick={()=> { setAnswers(a => ({...a, [current.name]: text })); setIdx(idx+1); setMask(true) }}>Next Player →</button>}
          {idx > 0 && <button className="btn-ghost" onClick={()=> { setAnswers(a => ({...a, [current.name]: text })); setIdx(idx-1); setMask(true) }}>← Previous</button>}
        </div>
        <div className="mt-2 text-xs text-white/60">Saved: {Object.values(answers).filter(Boolean).length}/{players.length}</div>
      </div>
    </div>
  )
}

function RevealLine({ item, guess }){
  const who = item.for
  const correct = guess === who
  return (
    <div className="text-white/90">
      <div className="mb-1">{correct ? '✅' : '✨'} {guess ? `${guess} guessed` : 'No guess'}.</div>
      <div className="">The {item.type.toLowerCase()} belonged to <span className="font-semibold">{who}</span>.</div>
    </div>
  )
}

function Confetti(){
  const pieces = Array.from({ length: 24 })
  return (
    <div aria-hidden className="pointer-events-none relative">
      <div style={{position:'absolute', inset:0, zIndex:0}}>
        {pieces.map((_,i)=>{
          const left = Math.random()*100
          const delay = Math.random()*0.6
          const duration = 2 + Math.random()*1.2
          const size = 4 + Math.random()*6
          return (
            <span key={i} style={{
              position:'absolute', left: left+'%', top:-10,
              width:size, height:size, borderRadius:1,
              background: i%2? '#ffd88e' : '#ffe8b8',
              filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
              animation: `fall ${duration}s ease-in ${delay}s forwards`
            }} />
          )
        })}
      </div>
      <style jsx>{`
        @keyframes fall { from { transform: translateY(0) rotate(0deg); opacity: 1 } to { transform: translateY(180px) rotate(180deg); opacity: 0 } }
      `}</style>
    </div>
  )
}

function Scores({ players, encoded, guesses }){
  const scores = Object.fromEntries(players.map(p => [p.name, 0]))
  for(const it of encoded){
    if(guesses[it.id] && guesses[it.id] === it.for){ scores[guesses[it.id]] = (scores[guesses[it.id]]||0)+1 }
  }
  const list = players.map(p => ({ name: p.name, avatar: p.avatar, score: scores[p.name]||0 }))
  return (
    <div className="card">
      <div className="text-sm text-white/70 mb-2">Insight Points</div>
      <div className="flex flex-wrap gap-3">
        {list.map(x => (
          <div key={x.name} className="token selected">
            <span className="avatar">{x.avatar}</span>
            <span className="font-semibold">{x.name}</span>
            <span>· {x.score}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 oracle">Every truth hides a little magic. Shall we uncover another?</div>
    </div>
  )
}

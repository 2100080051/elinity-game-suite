import { useEffect, useMemo, useRef, useState } from 'react'

const THEMES = ['Random', 'Fantasy', 'Sci-Fi', 'Comedy', 'Romance', 'Mystery']

export default function Home() {
  const [stage, setStage] = useState('title') // title | play
  const [theme, setTheme] = useState('Random')
  const [players, setPlayers] = useState([{ name: 'You' }])
  const [scene, setScene] = useState(null)
  const [chat, setChat] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)
  const [clapper, setClapper] = useState(false)

  useEffect(() => { listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  async function callImprov(action, payload){
    setLoading(true)
    try{
      const res = await fetch('/api/improv', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, payload }) })
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || 'API error')
      return data
    }catch(e){
      console.error(e)
      return null
    }finally{ setLoading(false) }
  }

  async function startGame(){
    setClapper(true)
    setStage('play')
    const scenePromise = callImprov('scene', { theme, players: players.map(p=>p.name) })
    const minDelay = new Promise(r => setTimeout(r, 800))
    const data = await scenePromise
    if(data){
      setScene(data)
      setChat([{ role: 'ai', text: `🎭 ${data.intro || 'Let the improv begin!'}` }])
    }
    await minDelay
    setClapper(false)
  }

  async function sendLine(){
    if(!input.trim()) return
    const line = input.trim()
    setInput('')
    setChat(c => [...c, { role:'me', text: line }])
    const data = await callImprov('reply', { scene, line })
    if(data){ setChat(c => [...c, { role:'ai', text: `🎭 ${data.reply}` }]) }
  }

  async function escalate(){
    const data = await callImprov('escalate', { scene })
    if(data){ setChat(c => [...c, { role:'ai', text: `🎭 ${data.twist}` }]) }
  }

  async function addCharacter(){
    const data = await callImprov('add_character', { scene })
    if(data){ setChat(c => [...c, { role:'ai', text: `🎭 New character: ${data.character}` }]) }
  }

  async function endScene(){
    const data = await callImprov('end', { scene, chat })
    if(data){ setChat(c => [...c, { role:'ai', text: `🎭 ${data.ending}` }]) }
  }

  async function saveTranscript(){
    const entry = { date: new Date().toISOString(), theme, scene, chat }
    await fetch('/api/transcripts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(entry) })
    alert('Transcript saved')
  }

  return (
    <div className="space-y-6">
      {clapper && (
        <div className="clapper-overlay" role="status" aria-live="polite">
          <div className="clapper">🎬</div>
        </div>
      )}
      {stage === 'title' && (
        <div className="card spotlight card-neon">
          <h1 className="spot-title text-3xl sm:text-4xl font-extrabold text-glow">🎭 ElinityAI Presents: AI Improv Theater</h1>
          <p className="mt-2 text-white/80">Fast-paced, laughter-filled roleplay where ElinityAI sets the scene, plays along, and keeps the chaos fun.</p>
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <label className="text-white/70 text-sm" htmlFor="theme-select">Pick a Theme</label>
            <select
              id="theme-select"
              className="input w-56"
              value={theme}
              onChange={e => setTheme(e.target.value)}
            >
              {THEMES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={startGame}>{loading ? 'Loading...' : 'Start Game'}</button>
            <button className="btn-outline" onClick={startGame}>New Scene</button>
            <button className="btn-outline" onClick={()=>alert('How to Play: I set a scene. You act in character. Use Escalate for chaos. End Scene for a wrap-up.')}>
              How to Play
            </button>
          </div>
        </div>
      )}

      {stage === 'play' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card">
              <div className="text-sm text-white/70">Scene</div>
              <div className="mt-1 font-semibold">{scene?.scene || '—'}</div>
              <div className="text-white/80">{scene?.setting}</div>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {(scene?.roles || []).map((r,i)=> <span key={i} className="badge">{r}</span>)}
              </div>
            </div>

            <div className="card mt-4">
              <div ref={listRef} className="space-y-2 min-h-[320px]">
                {chat.map((m, i) => (
                  <div key={i} className={m.role === 'me' ? 'flex justify-end' : 'flex justify-start'}>
                    <div className={m.role === 'me' ? 'bubble-me' : 'bubble-ai'}>{m.text}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input className="input flex-1" placeholder="Your line..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') sendLine() }} />
                <button className="btn-primary" onClick={sendLine}>{loading ? '...' : 'Send'}</button>
              </div>
            </div>
          </div>

          <div className="card h-fit">
            <div className="grid gap-2">
              <button className="btn-outline btn-quick" onClick={escalate}>Escalate Scene 🚀</button>
              <button className="btn-outline btn-quick" onClick={addCharacter}>Add Character 👤</button>
              <button className="btn-outline btn-quick" onClick={endScene}>End Scene 🎬</button>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="btn-primary" onClick={startGame}>Start Next Scene</button>
              <button className="btn-outline" onClick={saveTranscript}>Save Scene Transcript</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

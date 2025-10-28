import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

function Bubble({ entry }){
  const role = entry.player
  const base = 'p-4 rounded-lg my-3 shadow-md max-w-prose'
  // friendly timestamp
  const ts = entry.ts ? new Date(entry.ts) : new Date()
  const time = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // avatar
  const Avatar = ({ who }) => {
    let label = 'AI'
    if (who === 'Player 1') label = 'P1'
    if (who === 'Player 2') label = 'P2'
    const bg = who === 'ElinityAI' ? 'bg-gradient-to-r from-purple-500 to-indigo-600' : 'bg-white/8'
    return (
      <div className={`avatar mr-3 ${bg} flex items-center justify-center text-white font-semibold`}>{label}</div>
    )
  }

  if (role === 'Player 1') return (
    <div className="flex items-start">
      <Avatar who={role} />
      <div className={`bubble-left ${base} text-white`}> 
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">{entry.player}</div>
          <div className="bubble-meta">{time}</div>
        </div>
        <div className="mt-2">{entry.line}</div>
      </div>
    </div>
  )

  if (role === 'Player 2') return (
    <div className="flex items-start justify-end">
      <div className={`bubble-right ${base} text-white mr-3`}> 
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">{entry.player}</div>
          <div className="bubble-meta">{time}</div>
        </div>
        <div className="mt-2">{entry.line}</div>
      </div>
      <Avatar who={role} />
    </div>
  )

  return (
    <div className="flex items-start justify-center">
      <div className={`bubble-ai ${base} text-white`}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">{entry.player}</div>
          <div className="bubble-meta">{time}</div>
        </div>
        <div className="mt-2">{entry.line}</div>
      </div>
    </div>
  )
}

export default function Home(){
  const [story, setStory] = useState([])
  const [player, setPlayer] = useState('Player 1')
  const [input, setInput] = useState('')
  const [turn, setTurn] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showSummary, setShowSummary] = useState(false)
  const [summary, setSummary] = useState({ title: '', recap: '', commentary: '' })
  const MAX_TURNS = 15
  const listRef = useRef(null)

  useEffect(()=>{
    // Placeholder for any focus/analytics on mount
  }, [])

  async function nextTurn(){
    if (!input.trim()) return
    setLoading(true)
    try{
      const payload = { player, line: input.trim(), story, turn_number: turn }
      const res = await axios.post('/api/next_turn', payload)
      const updated = res.data.story || story
      const twistInserted = !!res.data.twist_inserted
      // add timestamps for new lines
      const stamped = updated.map((s, i) => ({ ...s, ts: s.ts || Date.now() }))
      setStory(stamped)

      // Advance turn: player's submission counts as one turn; AI twist counts as an extra
      setTurn(t => {
        const next = t + (twistInserted ? 2 : 1)
        if (next > MAX_TURNS) {
          // Auto-end if exceeding max
          setTimeout(()=> endGame(), 300)
        }
        return next
      })

      // Switch player for the following human turn
      setPlayer(p => p === 'Player 1' ? 'Player 2' : 'Player 1')
      setInput('')
    }catch(e){
      alert('Error: ' + (e.response?.data?.error || e.message))
    }finally{ setLoading(false) }
  }

  async function endGame(){
    setLoading(true)
    try{
      const res = await axios.post('/api/end_game', { story })
      const raw = res.data?.result || ''
      const lines = raw.split('\n').map(l=>l.trim()).filter(Boolean)
      let title = '', recap = '', commentary = ''
      for (const l of lines){
        if (l.toLowerCase().startsWith('title:')) title = l.split(':').slice(1).join(':').trim()
        else if (l.toLowerCase().startsWith('recap:')) recap = l.split(':').slice(1).join(':').trim()
        else if (l.toLowerCase().startsWith('commentary:')) commentary = l.split(':').slice(1).join(':').trim()
      }
      if (!title && !recap && !commentary) recap = raw
      setSummary({ title, recap, commentary })
      setShowSummary(true)
    }catch(e){
      alert('Error ending game: ' + (e.response?.data?.error || e.message))
    }finally{ setLoading(false) }
  }

  function saveStory(){
    const text = story.map(s => `${s.player}: ${s.line}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'story.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  function newGame(){ setStory([]); setTurn(1); setInput(''); setShowSummary(false); setSummary({ title:'',recap:'',commentary:'' }) }

  function startGame(){
    const greeting = 'ElinityAI: Welcome to Story Relay! I am your Game Master — we will take turns adding lines and I will add surprising twists every 2–3 turns. Player 1, please give the opening line.'
    setStory([{ player: 'ElinityAI', line: greeting }])
    setShowIntro(false)
    setPlayer('Player 1')
    setTurn(1)
  }

  useEffect(()=>{
    // auto-scroll to bottom when story updates
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [story])

  return (
    <div className="min-h-screen flex">
      <div className="elinity-badge">ELINITY</div>
      {/* Sidebar */}
      <aside className="w-20 p-4 flex flex-col items-center space-y-6 glass-strong card-shadow">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-b from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">EG</div>
        <div className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center text-white">💜</div>
        <div className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center text-white">🎲</div>
        <div className="mt-auto text-white/60 text-xs">v1.0</div>
      </aside>

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="glass-strong p-6 rounded-xl card-shadow">
              <div className="flex items-center justify-between">
                <h1 className="text-white text-2xl font-bold">Story Relay 🎭</h1>
                <div className="space-x-2">
                  <button onClick={newGame} className="px-3 py-1 bg-white/10 text-white rounded">New Game</button>
                  <button onClick={saveStory} className="px-3 py-1 bg-white/10 text-white rounded">Save</button>
                </div>
              </div>

                <div className="mt-6">
                <h2 className="text-white text-lg font-semibold mb-3">Story Canvas</h2>
                <div className="mt-2 h-[60vh] overflow-y-auto p-2" ref={listRef}>
                  {story.length === 0 && (
                    <div className="text-white/70">The story is empty. Start by adding a line on the right.</div>
                  )}
                  {story.map((s,i)=> <div key={i} className="fade-in"><Bubble entry={s} /></div>)}
                </div>
              </div>
            </div>
          </div>

          <aside className="glass p-6 rounded-xl card-shadow">
            <h3 className="text-white text-lg font-semibold">Current Turn</h3>
            <div className="mt-4">
              <label className="text-white/80 text-sm">Player</label>
              <select value={player} onChange={e=>setPlayer(e.target.value)} className="mt-2 w-full rounded px-3 py-2 text-black">
                <option>Player 1</option>
                <option>Player 2</option>
              </select>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-white/90">Turn</div>
              <div className="text-white font-semibold">{turn} / {MAX_TURNS}</div>
            </div>

            <div className="mt-3">
              <div className="progress-track w-full">
                <div className="progress-fill" style={{ width: `${Math.min(100, (turn / MAX_TURNS) * 100)}%` }} />
              </div>
            </div>

            <textarea
              value={input}
              onChange={e=>setInput(e.target.value)}
              rows={6}
              onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); nextTurn(); } }}
              className="w-full mt-4 p-3 rounded-lg text-white bg-black/40 placeholder-white/50 caret-white backdrop-blur-sm"
              placeholder="Write your line... (Enter to send, Shift+Enter for newline)"
            />

            <div className="mt-4 grid grid-cols-1 gap-2">
              <button onClick={nextTurn} disabled={loading} className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg">Next Turn</button>
              <button onClick={endGame} disabled={loading} className="w-full px-4 py-2 bg-white/6 text-white rounded-lg border border-white/8">End Game</button>
            </div>
          </aside>
        </div>
      </main>

      {/* Intro and Summary Modals */}
      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative max-w-2xl w-full p-6 glass-strong rounded-xl">
            <h2 className="text-white text-2xl font-bold">Story Relay</h2>
            <p className="text-white/80 mt-3">Players co-create a story line by line. Every 2–3 turns the AI adds a twist. Play until you decide to stop or reach 10–15 turns. Ready to begin?</p>
            <div className="mt-4 flex justify-end">
              <button onClick={startGame} className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded">Start Game</button>
            </div>
          </div>
        </div>
      )}

      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative max-w-3xl w-full p-6 glass-strong rounded-xl">
            <h2 className="text-white text-2xl font-bold">{summary.title || 'Story Summary'}</h2>
            <div className="mt-4 text-white/80"><strong>Recap:</strong>
              <div className="mt-2 text-white/90">{summary.recap}</div>
            </div>
            {summary.commentary && (
              <div className="mt-4 text-white/80"><strong>Commentary:</strong>
                <div className="mt-2 text-white/90">{summary.commentary}</div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button onClick={()=> setShowSummary(false)} className="px-4 py-2 bg-white/10 text-white rounded">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

export default function Home(){
  const [worldState, setWorldState] = useState(null) // { world_name, theme, parameters, history, session_count, open_questions }
  const [chat, setChat] = useState([]) // { role: 'player'|'architect', text }
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const chatRef = useRef(null)

  useEffect(()=>{ if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [chat])

  async function startWorld(){
    setLoading(true)
    try{
      const res = await axios.post('/api/start_world', {})
      const greeting = res.data?.message || "Hello, dreamer! 🌙 Welcome to Dream Builder. What type of world shall we begin with?"
      setChat([{ role: 'architect', text: greeting }])
      setWorldState(res.data?.state || { world_name: '', theme: '', parameters: {}, history: [], session_count: 1, open_questions: [] })
      setGameStarted(true)
    }catch(e){
      alert('Error starting: ' + (e.response?.data?.error || e.message))
    }finally{ setLoading(false) }
  }

  async function sendMessage(){
    if (!input.trim()) return
    const msg = input.trim()
    setInput('')
    setChat(c => [...c, { role: 'player', text: msg }])
    setLoading(true)

    try{
      const res = await axios.post('/api/update_world', { worldState, message: msg })
      const reply = res.data?.reply || 'Interesting choice!'
      const newState = res.data?.state || worldState
      setWorldState(newState)
      setChat(c => [...c, { role: 'architect', text: reply }])
    }catch(e){
      setChat(c => [...c, { role: 'architect', text: 'Error processing your input. Please try again.' }])
    }finally{ setLoading(false) }
  }

  async function saveSession(){
    setLoading(true)
    try{
      const res = await axios.post('/api/save_session', { worldState, chat })
      const snapshot = res.data?.snapshot || JSON.stringify(worldState)
      navigator.clipboard.writeText(snapshot)
      alert('Session snapshot copied to clipboard! Paste it next time to resume.')
    }catch(e){
      alert('Error saving: ' + (e.response?.data?.error || e.message))
    }finally{ setLoading(false) }
  }

  async function loadSession(){
    const snap = prompt('Paste your session snapshot here:')
    if (!snap) return
    try{
      const state = JSON.parse(snap)
      setWorldState(state)
      setGameStarted(true)
      setChat([{ role: 'architect', text: `Welcome back! Resuming your world: ${state.world_name || 'Unnamed'}. Let's continue building.` }])
    }catch(e){
      alert('Invalid snapshot. Please check and try again.')
    }
  }

  function newWorld(){
    setWorldState(null)
    setChat([])
    setGameStarted(false)
    setInput('')
  }

  return (
    <div className="min-h-screen flex">
      <div className="elinity-badge">ELINITY</div>
      {/* Sidebar */}
      <aside className="w-20 p-4 flex flex-col items-center space-y-6 glass-strong card-shadow">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">DB</div>
        <div className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center text-white">🌙</div>
        <div className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center text-white">🏝️</div>
        <div className="mt-auto text-white/60 text-xs">v1.0</div>
      </aside>

      <main className="flex-1 p-8">
        {!gameStarted ? (
          <div className="max-w-3xl mx-auto mt-20">
            <div className="glass-strong p-8 rounded-xl card-shadow text-center">
              <h1 className="text-white text-4xl font-bold mb-4">Dream Builder 🌙</h1>
              <p className="text-white/80 text-lg mb-6">
                Co-create an evolving dream world with The Architect. Build an island, city, utopia, or any world you imagine. Your progress is saved across sessions.
              </p>
              <div className="space-x-3">
                <button onClick={startWorld} disabled={loading} className="btn-primary px-6 py-3 rounded-lg font-semibold">
                  {loading ? 'Starting...' : 'Start New World'}
                </button>
                <button onClick={loadSession} className="btn-secondary px-6 py-3 rounded-lg font-semibold">
                  Load Session
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-white text-3xl font-bold">Dream Builder 🌙</h1>
                <div className="text-white/70 text-sm mt-1">{worldState?.world_name || 'Unnamed World'} — Session {worldState?.session_count || 1}</div>
              </div>
              <div className="space-x-2">
                <button onClick={saveSession} disabled={loading} className="btn-secondary px-4 py-2 rounded-lg">Save</button>
                <button onClick={newWorld} className="btn-secondary px-4 py-2 rounded-lg">New World</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat */}
              <div className="lg:col-span-2 glass-strong p-6 rounded-xl card-shadow">
                <h2 className="text-white text-xl font-semibold mb-4">Conversation with The Architect</h2>
                <div className="h-[60vh] overflow-y-auto mb-4" ref={chatRef}>
                  {chat.map((m,i)=> (
                    <div key={i} className={m.role === 'player' ? 'bubble-player text-white' : 'bubble-architect text-white'}>
                      <div className="text-xs text-white/70 mb-1">{m.role === 'player' ? 'You' : 'The Architect'}</div>
                      <div>{m.text}</div>
                    </div>
                  ))}
                  {loading && <div className="text-white/70 text-sm">The Architect is thinking...</div>}
                </div>

                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage() } }}
                    rows={2}
                    className="flex-1 p-3 rounded-lg border border-white/10"
                    placeholder="Describe your vision... (Enter to send)"
                  />
                  <button onClick={sendMessage} disabled={loading || !input.trim()} className="btn-primary px-6 rounded-lg">Send</button>
                </div>
              </div>

              {/* World State Panel */}
              <aside className="glass-strong p-6 rounded-xl card-shadow">
                <h3 className="text-white text-lg font-semibold mb-4">World Parameters</h3>
                <div className="space-y-3">
                  {worldState?.parameters && Object.keys(worldState.parameters).length > 0 ? (
                    Object.entries(worldState.parameters).map(([key, val])=> (
                      <div key={key} className="param-card">
                        <div className="text-white/70 text-xs uppercase mb-1">{key}</div>
                        <div className="text-white text-sm">{Array.isArray(val) ? val.join(', ') : val || 'Not set'}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-white/60 text-sm">Parameters will appear as you build your world.</div>
                  )}
                </div>

                {worldState?.history && worldState.history.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-white text-sm font-semibold mb-2">History</h4>
                    <div className="space-y-1 text-white/70 text-xs">
                      {worldState.history.map((h,i)=> <div key={i}>• {h}</div>)}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 glass rounded">
                  <div className="text-white/70 text-xs mb-2">💡 Tip</div>
                  <div className="text-white/90 text-xs">
                    Be imaginative and open. The Architect will guide you step by step. You can always refine or change elements later.
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

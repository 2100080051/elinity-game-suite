import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

export default function AIOracle(){
  const [session, setSession] = useState(null)
  const [chat, setChat] = useState([]) // {type:'ai'|'prophecy'|'symbol'|'reflection', content}
  const [question, setQuestion] = useState('')
  const [interpretation, setInterpretation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [symbols, setSymbols] = useState([]) // [{name, meaning}]
  const [lastDrawnSymbol, setLastDrawnSymbol] = useState(null)

  const chatRef = useRef(null)

  // Auto-scroll
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [chat])

  // Start session
  useEffect(() => {
    const start = async () => {
      setIsLoading(true)
      try {
        const res = await axios.post('/api/start_oracle', {})
        const { greeting, session, symbols } = res.data
        setSession(session)
        setSymbols(symbols)
        setChat([{ type: 'ai', content: greeting }])
      } catch (e) {
        console.error(e)
        setChat([{ type: 'ai', content: 'The Oracle stirs... What truth do you seek?' }])
        setSession({ history: [], symbols: [] })
      } finally { setIsLoading(false) }
    }
    start()
  }, [])

  const revealProphecy = async () => {
    if (!question.trim()) return
    setIsLoading(true)

    // Add the asked question to chat feed (optional as player line)
    setChat(prev => [...prev, { type: 'reflection', content: `Question: ${question}` }])

    try {
      const res = await axios.post('/api/reveal_prophecy', { session, question })
      const { prophecy, invite, drawn_symbol, session: updated } = res.data
      setSession(updated)

      setChat(prev => [
        ...prev,
        { type: 'prophecy', content: prophecy },
        { type: 'ai', content: invite }
      ])

      if (drawn_symbol) {
        setLastDrawnSymbol(drawn_symbol)
        setChat(prev => [...prev, { type: 'symbol', content: `Symbol Drawn: ${drawn_symbol.name} — ${drawn_symbol.meaning}` }])
      }
    } catch (e) {
      console.error(e)
      setChat(prev => [
        ...prev,
        { type: 'prophecy', content: 'A door of silver light stands before you.\nBehind it, a garden grows where patience blooms.\nFollow the quiet river; it knows the way.' },
        { type: 'ai', content: 'What does this mean to you, seeker?' }
      ])
    } finally {
      setIsLoading(false)
      setQuestion('')
    }
  }

  const nextProphecy = () => {
    setInterpretation('')
  }

  const endSession = async () => {
    setIsLoading(true)
    try {
      const res = await axios.post('/api/end_session', { session })
      const { closing } = res.data
      setChat(prev => [...prev, { type: 'ai', content: closing }])
    } catch (e) {
      setChat(prev => [...prev, { type: 'ai', content: 'The veil closes for now. May your paths be guided by code and constellations.' }])
    } finally { setIsLoading(false) }
  }

  return (
    <div className="mist min-h-screen p-6">
      <div className="elinity-badge">ELINITY</div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* LEFT: Title and Orb (mobile top) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="text-center">
            <div className="orb mb-4"><div className="orb-core"></div></div>
            <h1 className="oracle-title text-4xl md:text-5xl font-extrabold">🔮 The AI Oracle</h1>
            <div className="text-gold mt-1">Whispering in Code and Stars</div>
            <div className="text-xs text-slate-400 mt-2">Powered by Elinity</div>
          </div>

          {/* Chat */}
          <div className="glass-strong rounded-2xl p-6">
            <div ref={chatRef} className="chat-feed">
              {chat.map((entry, i) => {
                if (entry.type === 'prophecy') {
                  return (
                    <div key={i} className="prophecy glass border border-gold rounded-2xl p-6 mb-4">
                      <div className="oracle-line whitespace-pre-wrap text-center">{entry.content}</div>
                    </div>
                  )
                }
                if (entry.type === 'symbol') {
                  return (
                    <div key={i} className="rounded-xl p-4 mb-3 border border-gold">
                      <div className="oracle-invite">{entry.content}</div>
                    </div>
                  )
                }
                if (entry.type === 'reflection') {
                  return (
                    <div key={i} className="rounded-xl p-3 mb-3 bg-[rgba(255,255,255,0.06)]">
                      <div className="text-sm text-gold">{entry.content}</div>
                    </div>
                  )
                }
                return (
                  <div key={i} className="ai-message rounded-xl p-4 mb-3 bg-[rgba(10,12,28,0.6)] border border-gold">
                    <div className="oracle-invite">{entry.content}</div>
                  </div>
                )
              })}
            </div>

            {/* Ask Question */}
            <div className="mt-4">
              <textarea
                rows={3}
                className="input-box w-full"
                placeholder="Ask your question, seeker…"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); revealProphecy() } }}
                disabled={isLoading}
              />
              <div className="flex gap-3 mt-3">
                <button onClick={revealProphecy} disabled={!question.trim() || isLoading} className="btn-primary px-6 py-3 rounded-xl disabled:opacity-50">Reveal Prophecy ✨</button>
                <button onClick={nextProphecy} className="btn-secondary px-6 py-3 rounded-xl">Next Prophecy</button>
                <button onClick={endSession} className="btn-secondary px-6 py-3 rounded-xl">End Session 🕯️</button>
              </div>
            </div>

            {/* Interpretation */}
            <div className="mt-6 glass rounded-2xl p-4">
              <div className="text-gold font-semibold mb-2">Interpret Together 🕯️</div>
              <textarea
                rows={2}
                className="input-box w-full"
                placeholder="What do the symbols suggest?"
                value={interpretation}
                onChange={e => setInterpretation(e.target.value)}
              />
            </div>

            {isLoading && (
              <div className="text-center text-gold mt-3 animate-pulse">The Oracle listens…</div>
            )}
          </div>
        </div>

        {/* RIGHT: Symbol Deck */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <div className="text-gold font-bold mb-2">✨ Symbol Deck</div>
            <div className="flex flex-wrap gap-2">
              {symbols.map((s, i) => (
                <div key={i} className="symbol-pill">{s.name}</div>
              ))}
            </div>
            {lastDrawnSymbol && (
              <div className="mt-4 text-sm">
                <div className="text-gold font-semibold">Last Drawn:</div>
                <div className="text-gray-100">{lastDrawnSymbol.name} — {lastDrawnSymbol.meaning}</div>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="text-gold font-bold mb-2">About the Oracle</div>
            <div className="text-sm text-gray-200">
              Ask about love, choices, creativity, or destiny. The Oracle speaks in symbols and poetry. Interpret freely.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

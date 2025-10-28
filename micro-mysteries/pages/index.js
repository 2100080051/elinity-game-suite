import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

export default function Home() {
  const [gameState, setGameState] = useState('setup') // setup | investigating | revealed
  const [mysteryData, setMysteryData] = useState(null)
  const [chatLog, setChatLog] = useState([])
  const [playerInput, setPlayerInput] = useState('')
  const [playerGuess, setPlayerGuess] = useState('')
  const [solution, setSolution] = useState(null)
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatLog])

  // Start new mystery
  const startMystery = async () => {
    setLoading(true)
    try {
      const res = await axios.post('/api/start_mystery')
      setMysteryData(res.data.mystery)
      setChatLog([
        { type: 'ai', text: res.data.mystery.intro },
        { type: 'ai', text: "🔍 I'm the witness. Ask me anything..." }
      ])
      setGameState('investigating')
    } catch (err) {
      console.error('start_mystery error:', err)
      alert('Failed to start mystery. Check API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Ask question
  const askQuestion = async (question) => {
    if (!question.trim() || loading) return

    const userMessage = question.trim()
    setChatLog(prev => [...prev, { type: 'player', text: userMessage }])
    setPlayerInput('')
    setLoading(true)

    try {
      const res = await axios.post('/api/ask_question', {
        question: userMessage,
        mystery: mysteryData,
        chat_history: chatLog
      })
      
      setChatLog(prev => [...prev, { type: 'ai', text: res.data.answer }])
    } catch (err) {
      console.error('ask_question error:', err)
      setChatLog(prev => [...prev, { 
        type: 'ai', 
        text: "🤔 Sorry, I got distracted. Could you repeat that?" 
      }])
    } finally {
      setLoading(false)
    }
  }

  // Submit final guess
  const submitGuess = async () => {
    if (!playerGuess.trim() || loading) return

    setLoading(true)
    setChatLog(prev => [...prev, { type: 'player', text: `🎯 MY THEORY: ${playerGuess}` }])

    try {
      const res = await axios.post('/api/reveal_solution', {
        player_guess: playerGuess,
        mystery: mysteryData,
        chat_history: chatLog
      })
      
      setSolution(res.data)
      setGameState('revealed')
    } catch (err) {
      console.error('reveal_solution error:', err)
      alert('Failed to reveal solution. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // Reset for new mystery
  const playAgain = () => {
    setGameState('setup')
    setMysteryData(null)
    setChatLog([])
    setPlayerInput('')
    setPlayerGuess('')
    setSolution(null)
  }

  // Quick ask buttons
  const quickQuestions = [
    "Where were you?",
    "What did you see?",
    "Who else was there?",
    "What time was it?",
    "Anything suspicious?"
  ]

  // ============================================
  // RENDER: SETUP
  // ============================================
  if (gameState === 'setup') {
    return (
      <div className="detective-bg">
        <div className="elinity-badge">ELINITY</div>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="parchment card-shadow rounded-3xl p-10 max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4 magnify-icon">🕵️</div>
              <h1 className="text-5xl font-bold detective-title mb-4">
                Micro-Mysteries
              </h1>
              <p className="text-xl text-amber-200/80 mb-2 font-serif">
                Solve It If You Can!
              </p>
              <div className="inline-block glass rounded-full px-6 py-2 text-sm text-amber-100/60 mt-4">
                🎮 Powered by ElinityAI
              </div>
            </div>

            <div className="glass-strong rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-serif font-bold text-amber-300 mb-4">
                🔎 How to Play
              </h2>
              <ul className="space-y-3 text-base text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 font-bold">1.</span>
                  <span>ElinityAI presents a mini-mystery (5–10 min to solve)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 font-bold">2.</span>
                  <span>Interrogate the witness — ask clever questions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 font-bold">3.</span>
                  <span>Gather clues, spot red herrings, deduce the truth</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 font-bold">4.</span>
                  <span>Submit your final theory and see if you cracked it!</span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-200/80 text-center">
                💡 <strong>Tip:</strong> Every mystery is solvable with the right questions!
              </p>
            </div>

            <button
              onClick={startMystery}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-lg btn-primary disabled:opacity-50 transition-all"
            >
              {loading ? (
                <span className="loading-dots">
                  Starting Mystery<span>.</span><span>.</span><span>.</span>
                </span>
              ) : (
                '🔍 Start New Mystery'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: INVESTIGATING
  // ============================================
  if (gameState === 'investigating') {
    return (
      <div className="detective-bg">
        <div className="elinity-badge">ELINITY</div>
        <div className="min-h-screen p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold detective-title mb-2">
              🕵️ Micro-Mysteries
            </h1>
            <p className="text-sm text-amber-200/60">Case in progress...</p>
          </div>

          <div className="max-w-4xl mx-auto grid gap-6">
            {/* Mystery Scene Card */}
            <div className="parchment card-shadow rounded-2xl p-6 case-card">
              <h2 className="text-2xl font-serif font-bold text-amber-300 mb-4 flex items-center gap-2">
                📋 The Case
              </h2>
              <p className="text-lg leading-relaxed font-serif text-slate-100">
                {mysteryData?.scene}
              </p>
            </div>

            {/* Chat Interface */}
            <div className="glass-strong rounded-2xl p-6">
              <h3 className="text-xl font-bold text-amber-300 mb-4 flex items-center gap-2">
                💬 Interrogation
              </h3>
              
              {/* Chat Log */}
              <div className="chat-scroll max-h-96 overflow-y-auto mb-4 space-y-3 pr-2">
                {chatLog.map((msg, i) => (
                  <div
                    key={i}
                    className={`chat-message rounded-xl p-4 ${
                      msg.type === 'ai' ? 'ai-message' : 'player-message'
                    }`}
                  >
                    <div className="font-semibold text-xs mb-1 opacity-70">
                      {msg.type === 'ai' ? '🎭 WITNESS' : '🕵️ YOU'}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                ))}
                {loading && (
                  <div className="ai-message rounded-xl p-4">
                    <div className="font-semibold text-xs mb-1 opacity-70">🎭 WITNESS</div>
                    <div className="loading-dots">
                      Thinking<span>.</span><span>.</span><span>.</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Questions */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2">Quick asks:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => askQuestion(q)}
                      disabled={loading}
                      className="quick-ask-btn"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Question Input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && askQuestion(playerInput)}
                  placeholder="Ask your own question..."
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 border border-amber-500/20 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50"
                />
                <button
                  onClick={() => askQuestion(playerInput)}
                  disabled={loading || !playerInput.trim()}
                  className="px-6 py-3 rounded-xl btn-primary"
                >
                  Ask
                </button>
              </div>
            </div>

            {/* Submit Solution */}
            <div className="parchment card-shadow rounded-2xl p-6">
              <h3 className="text-xl font-bold text-amber-300 mb-4 flex items-center gap-2">
                🎯 Your Theory
              </h3>
              <textarea
                value={playerGuess}
                onChange={(e) => setPlayerGuess(e.target.value)}
                placeholder="Who did it? How? Why? Write your final deduction here..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-amber-500/20 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 mb-4 resize-none"
              />
              <button
                onClick={submitGuess}
                disabled={loading || !playerGuess.trim()}
                className="w-full py-4 rounded-xl font-bold text-lg btn-primary"
              >
                {loading ? 'Revealing...' : '🔓 Reveal Solution'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: REVEALED
  // ============================================
  if (gameState === 'revealed') {
    return (
      <div className="detective-bg">
        <div className="elinity-badge">ELINITY</div>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-3xl w-full reveal-card">
            <div className="parchment card-shadow rounded-3xl p-10">
              {/* Result Badge */}
              <div className="text-center mb-8">
                <div className="text-7xl mb-4">
                  {solution?.correct ? '🎉' : '🤔'}
                </div>
                <div className="mb-4">
                  {solution?.correct ? (
                    <div className="solved-badge">
                      <span>✅</span>
                      <span>CASE SOLVED!</span>
                    </div>
                  ) : (
                    <div className="unsolved-badge">
                      <span>❌</span>
                      <span>NICE TRY!</span>
                    </div>
                  )}
                </div>
                <h2 className="text-3xl font-bold detective-title">
                  {solution?.correct ? 'You Cracked It!' : 'The Truth Revealed'}
                </h2>
              </div>

              {/* Player's Guess */}
              <div className="glass rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-amber-300 mb-2">🕵️ Your Theory:</h3>
                <p className="text-slate-200 leading-relaxed">{playerGuess}</p>
              </div>

              {/* Actual Solution */}
              <div className="glass-strong rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-amber-300 mb-2">✨ What Really Happened:</h3>
                <p className="text-lg leading-relaxed font-serif text-slate-100 mb-4">
                  {solution?.explanation}
                </p>
                <div className="border-t border-amber-500/20 pt-4 mt-4">
                  <p className="text-base italic text-amber-200/80 font-serif">
                    {solution?.witty_outro}
                  </p>
                </div>
              </div>

              {/* Mystery Details */}
              <div className="bg-slate-800/30 rounded-xl p-4 mb-6 text-sm text-slate-300">
                <p className="font-semibold text-amber-300 mb-2">📋 Original Case:</p>
                <p className="font-serif leading-relaxed">{mysteryData?.scene}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={playAgain}
                  className="flex-1 py-4 rounded-xl font-bold text-lg btn-primary"
                >
                  🔍 Next Mystery
                </button>
                <button
                  onClick={() => setGameState('investigating')}
                  className="flex-1 py-4 rounded-xl font-bold text-lg btn-secondary"
                >
                  📖 Review Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

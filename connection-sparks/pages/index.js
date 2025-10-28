import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function ConnectionSparks() {
  // Game State
  const [gameState, setGameState] = useState('setup') // 'setup' | 'playing' | 'complete'
  const [playerNames, setPlayerNames] = useState(['', ''])
  const [chat, setChat] = useState([]) // [{type: 'ai'|'player', content, player, timestamp}]
  const [currentRound, setCurrentRound] = useState(0)
  const [currentPrompt, setCurrentPrompt] = useState(null)
  const [answerInput, setAnswerInput] = useState('')
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [sparksEarned, setSparksEarned] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState(null)
  const [gameSession, setGameSession] = useState(null)

  const chatRef = useRef(null)

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [chat])

  // Update player name
  const updatePlayerName = (index, value) => {
    const updated = [...playerNames]
    updated[index] = value
    setPlayerNames(updated)
  }

  // Start Game
  const startGame = async () => {
    const filtered = playerNames.filter(n => n.trim())
    if (filtered.length < 2) return alert('Need 2 players!')

    setIsLoading(true)
    try {
      const response = await axios.post('/api/start_game', { players: filtered })
      const { welcome_message, first_prompt, session } = response.data

      setGameSession(session)
      setCurrentPrompt(first_prompt)
      setChat([{ type: 'ai', content: welcome_message, timestamp: Date.now() }])
      setCurrentRound(1)
      setGameState('playing')
    } catch (error) {
      console.error('Start error:', error)
      alert('Error starting game. Check console.')
    } finally {
      setIsLoading(false)
    }
  }

  // Submit Answer
  const submitAnswer = async () => {
    if (!answerInput.trim()) return

    const playerName = gameSession.players[currentPlayerIndex]
    const newAnswer = { type: 'player', content: answerInput, player: playerName, timestamp: Date.now() }
    setChat(prev => [...prev, newAnswer])

    setIsLoading(true)
    const tempAnswer = answerInput
    setAnswerInput('')

    try {
      const response = await axios.post('/api/submit_answer', {
        session: gameSession,
        player_name: playerName,
        answer: tempAnswer,
        current_prompt: currentPrompt,
        round: currentRound
      })

      const { ai_reaction, spark_earned } = response.data

      // Add AI reaction
      setChat(prev => [...prev, { type: 'reaction', content: ai_reaction, timestamp: Date.now() }])

      if (spark_earned) {
        setSparksEarned(prev => prev + 1)
      }

      // Rotate to next player (if 2 players, both answer before next prompt)
      const nextPlayerIndex = (currentPlayerIndex + 1) % gameSession.players.length

      if (nextPlayerIndex === 0) {
        // Both players answered, move to next prompt
        if (currentRound >= 10) {
          // Game complete
          endGame()
        } else {
          nextPrompt()
        }
      } else {
        setCurrentPlayerIndex(nextPlayerIndex)
      }
    } catch (error) {
      console.error('Answer error:', error)
      setChat(prev => [...prev, { type: 'reaction', content: '⚡ Quick! Keep going!', timestamp: Date.now() }])
      const nextPlayerIndex = (currentPlayerIndex + 1) % gameSession.players.length
      if (nextPlayerIndex === 0 && currentRound < 10) nextPrompt()
      else setCurrentPlayerIndex(nextPlayerIndex)
    } finally {
      setIsLoading(false)
    }
  }

  // Next Prompt
  const nextPrompt = async () => {
    setIsLoading(true)
    try {
      const response = await axios.post('/api/next_prompt', {
        session: gameSession,
        round: currentRound + 1
      })

      const { new_prompt } = response.data

      setCurrentPrompt(new_prompt)
      setChat(prev => [...prev, { type: 'ai', content: new_prompt, timestamp: Date.now() }])
      setCurrentRound(prev => prev + 1)
      setCurrentPlayerIndex(0)
    } catch (error) {
      console.error('Next prompt error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // End Game
  const endGame = async () => {
    setIsLoading(true)
    try {
      const response = await axios.post('/api/end_game', {
        session: gameSession,
        total_sparks: sparksEarned,
        total_rounds: 10
      })

      const { game_summary } = response.data
      setSummary(game_summary)
      setGameState('complete')
    } catch (error) {
      console.error('End game error:', error)
      setSummary(`🔥 Connection Sparks Complete! You earned ${sparksEarned}/10 sparks! Great energy!`)
      setGameState('complete')
    } finally {
      setIsLoading(false)
    }
  }

  // Restart
  const restart = () => {
    setGameState('setup')
    setPlayerNames(['', ''])
    setChat([])
    setCurrentRound(0)
    setCurrentPrompt(null)
    setAnswerInput('')
    setCurrentPlayerIndex(0)
    setSparksEarned(0)
    setSummary(null)
    setGameSession(null)
  }

  // ============================================
  // RENDER: SETUP SCREEN
  // ============================================
  if (gameState === 'setup') {
    return (
      <div className="spark-bg">
        <div className="elinity-badge">ELINITY</div>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass card-shadow rounded-3xl p-10 max-w-2xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-black mb-4 text-white drop-shadow-lg" style={{ fontFamily: "'Nunito', sans-serif" }}>
                ⚡ Connection Sparks
              </h1>
              <div className="host-badge text-white text-sm mt-4">
                Hosted by ElinityAI 💬
              </div>
              <p className="text-white/90 mt-6 leading-relaxed font-medium">
                Ready for rapid-fire fun? I'll hit you with 10 quick prompts - answer fast, laugh hard, and spark connections! 
                No overthinking allowed! 🔥
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <label className="block text-white font-bold mb-2">Players (2 required)</label>
              {playerNames.map((name, i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={`Player ${i + 1} Name`}
                  value={name}
                  onChange={(e) => updatePlayerName(i, e.target.value)}
                  className="w-full px-5 py-3 rounded-xl transition-all"
                />
              ))}
            </div>

            <button
              onClick={startGame}
              disabled={isLoading || playerNames.filter(n => n.trim()).length < 2}
              className="btn-primary w-full py-4 rounded-xl text-lg font-black disabled:opacity-50"
            >
              {isLoading ? 'Starting...' : '⚡ Start Sparking!'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: PLAYING (MAIN GAME)
  // ============================================
  if (gameState === 'playing') {
    const currentPlayer = gameSession?.players[currentPlayerIndex]
    const sparkPercentage = (sparksEarned / 10) * 100

    return (
      <div className="spark-bg">
        <div className="elinity-badge">ELINITY</div>
        <div className="min-h-screen p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-black text-white drop-shadow-lg" style={{ fontFamily: "'Nunito', sans-serif" }}>
              ⚡ Connection Sparks
            </h1>
            <div className="host-badge text-white text-sm mt-3">
              Hosted by ElinityAI 💬
            </div>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT & CENTER: Chat Feed (3 cols) */}
            <div className="lg:col-span-3 glass-strong rounded-2xl p-6 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">💬 Let's Go!</h2>
                <div className="round-indicator">
                  Round {currentRound}/10
                </div>
              </div>

              {/* Chat Feed */}
              <div ref={chatRef} className="chat-feed">
                {chat.map((msg, i) => {
                  if (msg.type === 'ai') {
                    return (
                      <div key={i} className="prompt-bubble">
                        <div className="flex items-start gap-3">
                          <span className="spark-icon">⚡</span>
                          <div className="flex-1">{msg.content}</div>
                        </div>
                      </div>
                    )
                  } else if (msg.type === 'reaction') {
                    return (
                      <div key={i} className="reaction-bubble">
                        {msg.content}
                      </div>
                    )
                  } else {
                    const isPlayer1 = msg.player === gameSession.players[0]
                    return (
                      <div key={i} className={isPlayer1 ? 'answer-bubble-p1' : 'answer-bubble-p2'}>
                        <div className="text-sm opacity-80 mb-1 font-bold">{msg.player}</div>
                        <div>{msg.content}</div>
                      </div>
                    )
                  }
                })}
              </div>

              {/* Answer Input */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-white font-bold text-lg">
                    🎯 {currentPlayer}'s turn!
                  </div>
                  {isLoading && <div className="text-orange-300 text-sm animate-pulse">Processing...</div>}
                </div>

                <textarea
                  placeholder="Type your answer quick!"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submitAnswer()
                    }
                  }}
                  disabled={isLoading}
                  className="w-full px-5 py-4 rounded-xl resize-none transition-all"
                  rows={2}
                />

                <button
                  onClick={submitAnswer}
                  disabled={!answerInput.trim() || isLoading}
                  className="btn-primary w-full py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  ⚡ Answer!
                </button>
              </div>
            </div>

            {/* RIGHT: Sidebar (1 col) */}
            <div className="space-y-6">
              {/* Spark Meter */}
              <div className="glass-strong rounded-2xl p-6 card-shadow">
                <h3 className="text-xl font-bold text-white mb-4">🔥 Spark Meter</h3>
                <div className="spark-meter">
                  <div className="spark-fill" style={{ width: `${sparkPercentage}%` }}></div>
                </div>
                <div className="text-center mt-3 text-white font-bold text-lg">
                  {sparksEarned} / 10 Sparks
                </div>
              </div>

              {/* Players */}
              <div className="glass-strong rounded-2xl p-6 card-shadow">
                <h3 className="text-xl font-bold text-white mb-4">👥 Players</h3>
                <div className="space-y-3">
                  {gameSession?.players.map((player, i) => (
                    <div
                      key={i}
                      className={`px-4 py-3 rounded-lg font-bold transition-all ${
                        i === currentPlayerIndex 
                          ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white transform scale-105' 
                          : 'bg-white/20 text-white/70'
                      }`}
                    >
                      {i === currentPlayerIndex && '▶ '}{player}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <button
                  onClick={endGame}
                  disabled={isLoading}
                  className="btn-secondary w-full py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  🏁 End Game
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: GAME COMPLETE
  // ============================================
  if (gameState === 'complete') {
    return (
      <div className="spark-bg">
        <div className="elinity-badge">ELINITY</div>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-strong card-shadow rounded-3xl p-10 max-w-3xl w-full game-complete">
            <div className="text-center mb-8">
              <div className="text-7xl mb-4">🔥</div>
              <h1 className="text-5xl font-black text-white mb-4" style={{ fontFamily: "'Nunito', sans-serif" }}>
                Connection Sparks Complete!
              </h1>
              <div className="text-white/90 text-xl font-semibold">
                You earned {sparksEarned}/10 Sparks! ⚡
              </div>
            </div>

            {summary && (
              <div className="bg-black/20 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-orange-300 mb-4">📊 Game Summary</h2>
                <div className="text-white leading-relaxed text-lg whitespace-pre-wrap">
                  {summary}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={restart}
                className="btn-primary flex-1 py-4 rounded-xl text-lg font-black"
              >
                🔁 Play Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

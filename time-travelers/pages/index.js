import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function TimeTravelers() {
  // Game State
  const [gameState, setGameState] = useState('setup') // 'setup' | 'traveling' | 'complete'
  const [playerNames, setPlayerNames] = useState(['', ''])
  const [story, setStory] = useState([]) // [{type: 'ai'|'player'|'glitch', content, player, timestamp}]
  const [currentEra, setCurrentEra] = useState(null) // {year, name, description}
  const [jumpCount, setJumpCount] = useState(0)
  const [playerInput, setPlayerInput] = useState('')
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [travelLog, setTravelLog] = useState(null) // Final summary
  const [gameSession, setGameSession] = useState(null) // {players, jumps: []}

  const storyFeedRef = useRef(null)

  // Auto-scroll story feed
  useEffect(() => {
    if (storyFeedRef.current) {
      storyFeedRef.current.scrollTop = storyFeedRef.current.scrollHeight
    }
  }, [story])

  // Setup: Add/Remove Players
  const updatePlayerName = (index, value) => {
    const updated = [...playerNames]
    updated[index] = value
    setPlayerNames(updated)
  }

  const addPlayer = () => {
    if (playerNames.length < 4) setPlayerNames([...playerNames, ''])
  }

  const removePlayer = () => {
    if (playerNames.length > 2) setPlayerNames(playerNames.slice(0, -1))
  }

  // Start Journey
  const startJourney = async () => {
    const filtered = playerNames.filter(n => n.trim())
    if (filtered.length < 2) return alert('At least 2 players required!')

    setIsLoading(true)
    try {
      const response = await axios.post('/api/start_journey', { players: filtered })
      const { welcome_message, first_era, session } = response.data

      setGameSession(session)
      setCurrentEra(first_era)
      setStory([{ type: 'ai', content: welcome_message, timestamp: Date.now() }])
      setJumpCount(1)
      setGameState('traveling')
    } catch (error) {
      console.error('Start error:', error)
      alert('Error starting journey. Check console.')
    } finally {
      setIsLoading(false)
    }
  }

  // Submit Player Response
  const submitResponse = async () => {
    if (!playerInput.trim()) return

    const playerName = gameSession.players[currentPlayerIndex]
    const newMessage = { type: 'player', content: playerInput, player: playerName, timestamp: Date.now() }
    setStory([...story, newMessage])

    setIsLoading(true)
    setPlayerInput('')

    try {
      const response = await axios.post('/api/player_respond', {
        session: gameSession,
        player_name: playerName,
        response: playerInput,
        current_era: currentEra
      })

      const { ai_reaction, is_glitch } = response.data

      const aiMessage = {
        type: is_glitch ? 'glitch' : 'ai',
        content: ai_reaction,
        timestamp: Date.now()
      }

      setStory(prev => [...prev, aiMessage])

      // Rotate to next player
      setCurrentPlayerIndex((currentPlayerIndex + 1) % gameSession.players.length)
    } catch (error) {
      console.error('Response error:', error)
      setStory(prev => [...prev, { type: 'ai', content: '⚠️ Temporal disruption detected. Try again.', timestamp: Date.now() }])
    } finally {
      setIsLoading(false)
    }
  }

  // Next Time Jump
  const nextTimeJump = async () => {
    setIsLoading(true)
    try {
      const response = await axios.post('/api/next_jump', {
        session: gameSession,
        jump_count: jumpCount,
        previous_era: currentEra
      })

      const { new_era, transition_message, session: updatedSession } = response.data

      setGameSession(updatedSession)
      setCurrentEra(new_era)
      setStory(prev => [...prev, { type: 'ai', content: transition_message, timestamp: Date.now() }])
      setJumpCount(jumpCount + 1)
      setCurrentPlayerIndex(0) // Reset turn order
    } catch (error) {
      console.error('Jump error:', error)
      alert('Error jumping through time. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // End Journey
  const endJourney = async () => {
    setIsLoading(true)
    try {
      const response = await axios.post('/api/end_journey', {
        session: gameSession,
        total_jumps: jumpCount
      })

      const { travel_log } = response.data
      setTravelLog(travel_log)
      setGameState('complete')
    } catch (error) {
      console.error('End journey error:', error)
      alert('Error ending journey. Check console.')
    } finally {
      setIsLoading(false)
    }
  }

  // Restart
  const restart = () => {
    setGameState('setup')
    setPlayerNames(['', ''])
    setStory([])
    setCurrentEra(null)
    setJumpCount(0)
    setPlayerInput('')
    setCurrentPlayerIndex(0)
    setTravelLog(null)
    setGameSession(null)
  }

  // ============================================
  // RENDER: SETUP SCREEN
  // ============================================
  if (gameState === 'setup') {
    return (
      <div className="stars">
        <div className="elinity-badge">ELINITY</div>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass card-shadow rounded-3xl p-10 max-w-2xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent" style={{ fontFamily: "'Orbitron', monospace" }}>
                ⏳ TIME TRAVELERS
              </h1>
              <div className="conductor-badge text-white text-sm mt-4">
                🕰️ Hosted by ElinityAI
              </div>
              <p className="text-slate-300 mt-6 leading-relaxed">
                Journey through history and beyond! Role-play as yourself in different eras, react to wild scenarios, and survive timeline glitches with your crew.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <label className="block text-amber-300 font-semibold mb-2">Time Travelers ({playerNames.length})</label>
              {playerNames.map((name, i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={`Traveler ${i + 1} Name`}
                  value={name}
                  onChange={(e) => updatePlayerName(i, e.target.value)}
                  className="w-full px-5 py-3 rounded-xl transition-all"
                />
              ))}
              <div className="flex gap-3">
                {playerNames.length < 4 && (
                  <button onClick={addPlayer} className="btn-secondary px-5 py-2 rounded-xl text-sm">
                    + Add Traveler
                  </button>
                )}
                {playerNames.length > 2 && (
                  <button onClick={removePlayer} className="btn-secondary px-5 py-2 rounded-xl text-sm">
                    − Remove Traveler
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={startJourney}
              disabled={isLoading || playerNames.filter(n => n.trim()).length < 2}
              className="btn-primary w-full py-4 rounded-xl text-lg font-black disabled:opacity-50"
            >
              {isLoading ? 'Preparing Time Machine...' : '🚀 Begin Journey'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: TRAVELING (MAIN GAME)
  // ============================================
  if (gameState === 'traveling') {
    const currentPlayer = gameSession?.players[currentPlayerIndex]

    return (
      <div className="stars">
        <div className="elinity-badge">ELINITY</div>
        <div className="min-h-screen p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-black bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent" style={{ fontFamily: "'Orbitron', monospace" }}>
              ⏳ TIME TRAVELERS
            </h1>
            <div className="conductor-badge text-white text-sm mt-3">
              🕰️ Hosted by ElinityAI
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: Story Feed */}
            <div className="lg:col-span-2 glass-strong rounded-2xl p-6 card-shadow">
              <h2 className="text-2xl font-bold text-amber-300 mb-4" style={{ fontFamily: "'Orbitron', monospace" }}>📖 Story Feed</h2>

              <div ref={storyFeedRef} className="story-feed">
                {story.length === 0 && (
                  <div className="text-slate-400 text-center py-10">Waiting for first time jump...</div>
                )}
                {story.map((msg, i) => {
                  if (msg.type === 'ai') {
                    return (
                      <div key={i} className="bubble-ai">
                        <div className="text-sm opacity-70 mb-1">ElinityAI</div>
                        <div className="text-base leading-relaxed">{msg.content}</div>
                      </div>
                    )
                  } else if (msg.type === 'glitch') {
                    return (
                      <div key={i} className="bubble-ai glitch-text">
                        <div className="text-sm opacity-70 mb-1">⚠️ TIMELINE GLITCH</div>
                        <div className="text-base leading-relaxed font-bold">{msg.content}</div>
                      </div>
                    )
                  } else {
                    return (
                      <div key={i} className="bubble-player">
                        <div className="text-sm opacity-70 mb-1">{msg.player}</div>
                        <div className="text-base leading-relaxed">{msg.content}</div>
                      </div>
                    )
                  }
                })}
              </div>

              {/* Input Area */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-amber-300 font-semibold">
                    🎭 Current Turn: <span className="text-white">{currentPlayer}</span>
                  </div>
                  {isLoading && <div className="text-violet-400 text-sm animate-pulse">⏳ Processing...</div>}
                </div>

                <textarea
                  placeholder={`${currentPlayer}, what do you do?`}
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submitResponse()
                    }
                  }}
                  disabled={isLoading}
                  className="w-full px-5 py-4 rounded-xl resize-none transition-all"
                  rows={3}
                />

                <button
                  onClick={submitResponse}
                  disabled={!playerInput.trim() || isLoading}
                  className="btn-primary w-full py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  📤 Respond
                </button>
              </div>
            </div>

            {/* RIGHT: Era Display + Timeline */}
            <div className="space-y-6">
              {/* Era Display */}
              <div className="glass-strong rounded-2xl p-6 card-shadow">
                <h3 className="text-xl font-bold text-amber-300 mb-4" style={{ fontFamily: "'Orbitron', monospace" }}>📍 Current Era</h3>
                {currentEra ? (
                  <div>
                    <div className="era-badge text-center w-full mb-4">
                      {currentEra.year}
                    </div>
                    <div className="text-center mb-3">
                      <div className="text-2xl font-bold text-white mb-2">{currentEra.name}</div>
                      <div className="era-description">{currentEra.description}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-center py-6">Awaiting first jump...</div>
                )}
              </div>

              {/* Timeline Map */}
              <div className="glass-strong rounded-2xl p-6 card-shadow">
                <h3 className="text-xl font-bold text-amber-300 mb-4" style={{ fontFamily: "'Orbitron', monospace" }}>🗺️ Timeline Map</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Jumps:</span>
                    <span className="text-white font-bold text-lg">{jumpCount} / 5</span>
                  </div>

                  {/* Visual timeline */}
                  <div className="flex items-center gap-2 mt-4">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <div key={num} className="flex items-center flex-1">
                        <div className={`timeline-dot ${jumpCount === num ? 'active' : ''} ${jumpCount > num ? 'completed' : ''}`} />
                        {num < 5 && <div className="timeline-line" />}
                      </div>
                    ))}
                  </div>

                  <div className="text-slate-400 text-xs mt-3">
                    {jumpCount < 5 ? 'Continue exploring or jump to next era' : 'Final era reached'}
                  </div>
                </div>
              </div>

              {/* Travelers List */}
              <div className="glass-strong rounded-2xl p-6 card-shadow">
                <h3 className="text-xl font-bold text-amber-300 mb-4" style={{ fontFamily: "'Orbitron', monospace" }}>👥 Travelers</h3>
                <div className="space-y-2">
                  {gameSession?.players.map((player, i) => (
                    <div
                      key={i}
                      className={`px-4 py-2 rounded-lg text-white font-medium ${
                        i === currentPlayerIndex ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black' : 'bg-white/5'
                      }`}
                    >
                      {i === currentPlayerIndex && '▶ '}{player}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={nextTimeJump}
                  disabled={isLoading || jumpCount >= 5}
                  className="btn-jump w-full py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  ⏩ Next Time Jump
                </button>
                <button
                  onClick={endJourney}
                  disabled={isLoading}
                  className="btn-secondary w-full py-3 rounded-xl font-bold"
                >
                  🏁 End Journey
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: JOURNEY COMPLETE
  // ============================================
  if (gameState === 'complete') {
    return (
      <div className="stars">
        <div className="elinity-badge">ELINITY</div>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-strong card-shadow rounded-3xl p-10 max-w-3xl w-full journey-complete">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">✨</div>
              <h1 className="text-4xl font-black text-amber-300 mb-3" style={{ fontFamily: "'Orbitron', monospace" }}>
                JOURNEY COMPLETE
              </h1>
              <div className="text-slate-300">Your adventure through time has ended...</div>
            </div>

            {travelLog && (
              <div className="bg-black/30 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-amber-300 mb-4">📜 Travel Log</h2>
                <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">{travelLog}</div>
              </div>
            )}

            <button
              onClick={restart}
              className="btn-primary w-full py-4 rounded-xl text-lg font-black"
            >
              🔄 New Journey
            </button>
          </div>
        </div>
      </div>
    )
  }
}

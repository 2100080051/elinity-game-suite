import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function CollaborativeCanvas() {
  // Game State
  const [gameState, setGameState] = useState('setup') // 'setup' | 'creating' | 'complete'
  const [playerNames, setPlayerNames] = useState(['', ''])
  const [artLog, setArtLog] = useState([]) // [{type: 'player'|'ai', content, player, round, timestamp}]
  const [currentRound, setCurrentRound] = useState(0)
  const [currentArtwork, setCurrentArtwork] = useState(null) // Placeholder or generated art description
  const [strokeInput, setStrokeInput] = useState('')
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [artStory, setArtStory] = useState(null)
  const [artStage, setArtStage] = useState('Beginning')
  const [gameSession, setGameSession] = useState(null)

  const logRef = useRef(null)

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [artLog])

  // Update art stage based on round
  useEffect(() => {
    if (currentRound >= 7) setArtStage('Completing')
    else if (currentRound >= 5) setArtStage('Harmonizing')
    else if (currentRound >= 3) setArtStage('Developing')
    else if (currentRound >= 1) setArtStage('Beginning')
  }, [currentRound])

  // Update player name
  const updatePlayerName = (index, value) => {
    const updated = [...playerNames]
    updated[index] = value
    setPlayerNames(updated)
  }

  // Add/Remove Players
  const addPlayer = () => {
    if (playerNames.length < 4) setPlayerNames([...playerNames, ''])
  }

  const removePlayer = () => {
    if (playerNames.length > 2) setPlayerNames(playerNames.slice(0, -1))
  }

  // Start Canvas
  const startCanvas = async () => {
    const filtered = playerNames.filter(n => n.trim())
    if (filtered.length < 2) return alert('Need at least 2 players!')

    setIsLoading(true)
    try {
      const response = await axios.post('/api/start_canvas', { players: filtered })
      const { welcome_message, canvas_description, session } = response.data

      setGameSession(session)
      setCurrentArtwork({ description: canvas_description, visual: 'blank' })
      setArtLog([{ type: 'ai', content: welcome_message, round: 0, timestamp: Date.now() }])
      setCurrentRound(1)
      setGameState('creating')
    } catch (error) {
      console.error('Start error:', error)
      alert('Error starting canvas. Check console.')
    } finally {
      setIsLoading(false)
    }
  }

  // Add Brush Stroke
  const addStroke = async () => {
    if (!strokeInput.trim()) return

    const playerName = gameSession.players[currentPlayerIndex]
    const newStroke = { type: 'player', content: strokeInput, player: playerName, round: currentRound, timestamp: Date.now() }
    setArtLog(prev => [...prev, newStroke])

    setIsLoading(true)
    const tempStroke = strokeInput
    setStrokeInput('')

    try {
      const response = await axios.post('/api/add_stroke', {
        session: gameSession,
        player_name: playerName,
        stroke_idea: tempStroke,
        current_artwork: currentArtwork,
        round: currentRound
      })

      const { art_narration, updated_artwork, session: updatedSession } = response.data

      // Add AI narration
      setArtLog(prev => [...prev, { type: 'ai', content: art_narration, round: currentRound, timestamp: Date.now() }])

      // Update artwork
      setCurrentArtwork(updated_artwork)
      setGameSession(updatedSession)

      // Rotate to next player
      setCurrentPlayerIndex((currentPlayerIndex + 1) % gameSession.players.length)
      
      // Increment round after all players have contributed
      if ((currentPlayerIndex + 1) % gameSession.players.length === 0) {
        setCurrentRound(prev => prev + 1)
      }
    } catch (error) {
      console.error('Stroke error:', error)
      setArtLog(prev => [...prev, { type: 'ai', content: 'The canvas accepts your vision...', round: currentRound, timestamp: Date.now() }])
      setCurrentPlayerIndex((currentPlayerIndex + 1) % gameSession.players.length)
    } finally {
      setIsLoading(false)
    }
  }

  // Finish Artwork
  const finishArtwork = async () => {
    setIsLoading(true)
    try {
      const response = await axios.post('/api/finish_artwork', {
        session: gameSession,
        total_rounds: currentRound,
        final_artwork: currentArtwork
      })

      const { art_story } = response.data
      setArtStory(art_story)
      setGameState('complete')
    } catch (error) {
      console.error('Finish error:', error)
      setArtStory('Your collaborative artwork is complete. Each stroke added beauty, each idea brought life. Together, you created something unique.')
      setGameState('complete')
    } finally {
      setIsLoading(false)
    }
  }

  // Restart
  const restart = () => {
    setGameState('setup')
    setPlayerNames(['', ''])
    setArtLog([])
    setCurrentRound(0)
    setCurrentArtwork(null)
    setStrokeInput('')
    setCurrentPlayerIndex(0)
    setArtStory(null)
    setArtStage('Beginning')
    setGameSession(null)
  }

  // ============================================
  // RENDER: SETUP SCREEN
  // ============================================
  if (gameState === 'setup') {
    return (
      <div className="gallery-bg">
        <div className="elinity-badge">ELINITY</div>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass card-shadow rounded-3xl p-10 max-w-2xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold mb-4 text-purple-700">
                🎨 Collaborative Canvas
              </h1>
              <div className="artist-badge text-sm mt-4">
                Co-Create with ElinityAI ✨
              </div>
              <p className="text-gray-700 mt-6 leading-relaxed">
                Welcome, artists. Together, we'll create something beautiful. Each of you will add brush strokes and ideas, 
                and I'll bring them to life on our shared canvas. There are no mistakes - only creative choices.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <label className="block text-purple-700 font-semibold mb-2">Artists ({playerNames.length})</label>
              {playerNames.map((name, i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={`Artist ${i + 1} Name`}
                  value={name}
                  onChange={(e) => updatePlayerName(i, e.target.value)}
                  className="w-full px-5 py-3 rounded-xl transition-all"
                />
              ))}
              <div className="flex gap-3">
                {playerNames.length < 4 && (
                  <button onClick={addPlayer} className="btn-secondary px-5 py-2 rounded-xl text-sm">
                    + Add Artist
                  </button>
                )}
                {playerNames.length > 2 && (
                  <button onClick={removePlayer} className="btn-secondary px-5 py-2 rounded-xl text-sm">
                    − Remove Artist
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={startCanvas}
              disabled={isLoading || playerNames.filter(n => n.trim()).length < 2}
              className="btn-primary w-full py-4 rounded-xl text-lg font-bold disabled:opacity-50"
            >
              {isLoading ? 'Preparing Canvas...' : '🖌️ Begin Creating'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: CREATING (MAIN GAME)
  // ============================================
  if (gameState === 'creating') {
    const currentPlayer = gameSession?.players[currentPlayerIndex]

    return (
      <div className="gallery-bg">
        <div className="elinity-badge">ELINITY</div>
        <div className="min-h-screen p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-purple-700">
              🎨 Collaborative Canvas
            </h1>
            <div className="artist-badge text-sm mt-3">
              Co-Create with ElinityAI ✨
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: Canvas Display */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-purple-700">🖼️ The Canvas</h2>
                <div className="round-badge">
                  Round {currentRound}
                </div>
              </div>

              <div className="canvas-frame relative">
                <div className="art-stage">{artStage}</div>
                {currentArtwork?.visual === 'blank' ? (
                  <div className="canvas-placeholder">
                    <div className="text-center">
                      <div className="text-6xl mb-3">🎨</div>
                      <div className="text-purple-400 font-medium">Your Canvas Awaits</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 min-h-[400px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-cyan-50">
                    <div className="text-center">
                      <div className="text-7xl mb-4">🖼️</div>
                      <div className="text-purple-700 font-semibold text-lg art-text max-w-md">
                        {currentArtwork?.description || 'The artwork evolves with each stroke...'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Artists List */}
              <div className="glass rounded-2xl p-4">
                <h3 className="text-lg font-semibold text-purple-700 mb-3">👥 Artists</h3>
                <div className="space-y-2">
                  {gameSession?.players.map((player, i) => (
                    <div
                      key={i}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        i === currentPlayerIndex 
                          ? 'current-artist' 
                          : 'bg-purple-50 text-purple-600'
                      }`}
                    >
                      {i === currentPlayerIndex && '🖌️ '}{player}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Art Log + Input */}
            <div className="space-y-6">
              {/* Art Log */}
              <div className="glass-strong rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-purple-700 mb-4">📜 Art Story Log</h3>

                <div ref={logRef} className="art-log">
                  {artLog.map((entry, i) => {
                    if (entry.type === 'ai') {
                      return (
                        <div key={i} className="ai-narration">
                          <div className="text-xs text-purple-500 mb-1 font-semibold">ElinityAI</div>
                          <div className="art-text">{entry.content}</div>
                        </div>
                      )
                    } else {
                      return (
                        <div key={i} className="player-prompt">
                          <div className="text-xs text-cyan-600 mb-1 font-semibold">{entry.player} - Round {entry.round}</div>
                          <div>"{entry.content}"</div>
                        </div>
                      )
                    }
                  })}
                </div>
              </div>

              {/* Stroke Input */}
              <div className="glass-strong rounded-2xl p-6">
                <div className="mb-4">
                  <div className="text-purple-700 font-bold text-lg mb-2">
                    🖌️ {currentPlayer}'s Turn
                  </div>
                  <div className="text-sm text-gray-600">
                    Add your brush stroke idea, color, or element to the canvas
                  </div>
                </div>

                <textarea
                  placeholder='E.g., "Add a sunset in the background" or "Paint a glowing river"'
                  value={strokeInput}
                  onChange={(e) => setStrokeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      addStroke()
                    }
                  }}
                  disabled={isLoading}
                  className="w-full px-5 py-4 rounded-xl resize-none transition-all"
                  rows={3}
                />

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={addStroke}
                    disabled={!strokeInput.trim() || isLoading}
                    className="btn-primary flex-1 py-3 rounded-xl font-bold disabled:opacity-50"
                  >
                    🖌️ Add Stroke
                  </button>
                  <button
                    onClick={finishArtwork}
                    disabled={isLoading || currentRound < 3}
                    className="btn-finish py-3 px-6 rounded-xl font-bold disabled:opacity-50"
                    title={currentRound < 3 ? 'Need at least 3 rounds' : 'Finish artwork'}
                  >
                    🎯 Finish
                  </button>
                </div>

                {isLoading && (
                  <div className="text-center text-purple-500 text-sm mt-3 animate-pulse">
                    ✨ Creating...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: ARTWORK COMPLETE
  // ============================================
  if (gameState === 'complete') {
    return (
      <div className="gallery-bg">
        <div className="elinity-badge">ELINITY</div>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-strong rounded-3xl p-10 max-w-4xl w-full artwork-complete">
            <div className="text-center mb-8">
              <div className="text-7xl mb-4">🎨</div>
              <h1 className="text-5xl font-bold text-purple-700 mb-4">
                Artwork Complete
              </h1>
              <div className="text-gray-700 text-xl font-medium">
                {currentRound} rounds of collaborative creation
              </div>
            </div>

            {/* Final Artwork Display */}
            <div className="canvas-frame mb-8">
              <div className="p-8 min-h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-cyan-50">
                <div className="text-center">
                  <div className="text-8xl mb-4">🖼️</div>
                  <div className="text-purple-700 font-semibold text-xl art-text max-w-2xl">
                    {currentArtwork?.description || 'Your unique collaborative artwork'}
                  </div>
                </div>
              </div>
            </div>

            {/* Art Story */}
            {artStory && (
              <div className="bg-purple-50 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-purple-700 mb-4 art-text">📖 The Art Story</h2>
                <div className="text-gray-700 leading-relaxed text-lg art-text whitespace-pre-wrap">
                  {artStory}
                </div>
              </div>
            )}

            {/* Artists Credits */}
            <div className="bg-cyan-50 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-cyan-700 mb-3">🎨 Created By:</h3>
              <div className="flex flex-wrap gap-2">
                {gameSession?.players.map((player, i) => (
                  <div key={i} className="bg-white px-4 py-2 rounded-full text-sm font-medium text-purple-700 border border-purple-200">
                    {player}
                  </div>
                ))}
                <div className="bg-purple-100 px-4 py-2 rounded-full text-sm font-medium text-purple-700 border border-purple-300">
                  + ElinityAI
                </div>
              </div>
            </div>

            <button
              onClick={restart}
              className="btn-primary w-full py-4 rounded-xl text-lg font-bold"
            >
              🔄 Create New Artwork
            </button>
          </div>
        </div>
      </div>
    )
  }
}

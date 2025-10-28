import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function FutureForecast() {
  // Game State
  const [gameState, setGameState] = useState('setup') // 'setup' | 'playing' | 'complete'
  const [playerNames, setPlayerNames] = useState(['', ''])
  const [chatFeed, setChatFeed] = useState([]) // [{type: 'ai'|'question'|'forecast', content, round}]
  const [currentRound, setCurrentRound] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [predictions, setPredictions] = useState({}) // {playerName: prediction}
  const [isLoading, setIsLoading] = useState(false)
  const [timelineSummary, setTimelineSummary] = useState(null)
  const [gameSession, setGameSession] = useState(null)
  const [hasBonusTwist, setHasBonusTwist] = useState(false)

  const chatRef = useRef(null)

  // Starfield effect
  useEffect(() => {
    const starfield = document.querySelector('.starfield')
    if (!starfield) return

    // Create 100 stars
    for (let i = 0; i < 100; i++) {
      const star = document.createElement('div')
      star.className = 'star'
      star.style.left = `${Math.random() * 100}%`
      star.style.top = `${Math.random() * 100}%`
      star.style.animationDelay = `${Math.random() * 3}s`
      starfield.appendChild(star)
    }

    return () => {
      if (starfield) starfield.innerHTML = ''
    }
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [chatFeed])

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

  // Start Game
  const startGame = async () => {
    const filtered = playerNames.filter(n => n.trim())
    if (filtered.length < 2) return alert('Need at least 2 players!')

    setIsLoading(true)
    try {
      const response = await axios.post('/api/start_forecast', { players: filtered })
      const { welcome_message, first_question, session } = response.data

      setGameSession(session)
      setChatFeed([
        { type: 'ai', content: welcome_message, round: 0 },
        { type: 'question', content: first_question.question, target: first_question.target_player, round: 1 }
      ])
      setCurrentQuestion(first_question)
      setCurrentRound(1)
      setGameState('playing')
      
      // Initialize predictions for all players
      const initialPredictions = {}
      filtered.forEach(name => {
        initialPredictions[name] = ''
      })
      setPredictions(initialPredictions)
    } catch (error) {
      console.error('Start error:', error)
      alert('Error starting game. Check console.')
    } finally {
      setIsLoading(false)
    }
  }

  // Update prediction
  const updatePrediction = (playerName, value) => {
    setPredictions(prev => ({ ...prev, [playerName]: value }))
  }

  // Submit Predictions
  const submitPredictions = async () => {
    // Check if all players have submitted
    const allSubmitted = gameSession.players.every(name => predictions[name]?.trim())
    if (!allSubmitted) return alert('All players need to submit their predictions!')

    setIsLoading(true)

    // Add player answers to feed
    const answerEntries = gameSession.players.map(name => ({
      type: 'player-answer',
      player: name,
      content: predictions[name],
      round: currentRound
    }))
    setChatFeed(prev => [...prev, ...answerEntries])

    try {
      const response = await axios.post('/api/submit_predictions', {
        session: gameSession,
        question: currentQuestion,
        predictions: predictions,
        round: currentRound
      })

      const { forecast, bonus_twist, session: updatedSession } = response.data

      // Add forecast to feed
      const forecastEntry = { type: 'forecast', content: forecast, round: currentRound }
      if (bonus_twist) {
        forecastEntry.bonus_twist = bonus_twist
        setHasBonusTwist(true)
      } else {
        setHasBonusTwist(false)
      }

      setChatFeed(prev => [...prev, forecastEntry])
      setGameSession(updatedSession)

      // Clear predictions for next round
      const clearedPredictions = {}
      gameSession.players.forEach(name => {
        clearedPredictions[name] = ''
      })
      setPredictions(clearedPredictions)
    } catch (error) {
      console.error('Submit error:', error)
      setChatFeed(prev => [...prev, {
        type: 'forecast',
        content: 'The crystal shows a beautiful future for everyone...',
        round: currentRound
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Next Question
  const nextQuestion = async () => {
    if (currentRound >= 5) {
      return finishGame()
    }

    setIsLoading(true)
    try {
      const response = await axios.post('/api/next_question', {
        session: gameSession,
        current_round: currentRound
      })

      const { question, session: updatedSession } = response.data

      setChatFeed(prev => [...prev, {
        type: 'question',
        content: question.question,
        target: question.target_player,
        round: currentRound + 1
      }])

      setCurrentQuestion(question)
      setCurrentRound(prev => prev + 1)
      setGameSession(updatedSession)
    } catch (error) {
      console.error('Next question error:', error)
      alert('Error loading next question')
    } finally {
      setIsLoading(false)
    }
  }

  // Finish Game
  const finishGame = async () => {
    setIsLoading(true)
    try {
      const response = await axios.post('/api/end_forecast', {
        session: gameSession,
        total_rounds: currentRound
      })

      const { timeline_summary } = response.data
      setTimelineSummary(timeline_summary)
      setGameState('complete')
    } catch (error) {
      console.error('Finish error:', error)
      setTimelineSummary({
        summary: 'The future holds wonderful surprises for everyone!',
        player_futures: gameSession.players.map(name => ({
          player: name,
          future_snapshot: 'A bright and exciting journey awaits!'
        }))
      })
      setGameState('complete')
    } finally {
      setIsLoading(false)
    }
  }

  // Restart
  const restart = () => {
    setGameState('setup')
    setPlayerNames(['', ''])
    setChatFeed([])
    setCurrentRound(0)
    setCurrentQuestion(null)
    setPredictions({})
    setTimelineSummary(null)
    setGameSession(null)
    setHasBonusTwist(false)
  }

  // ============================================
  // RENDER: SETUP SCREEN
  // ============================================
  if (gameState === 'setup') {
    return (
      <div className="fortune-bg">
        <div className="elinity-badge">ELINITY</div>
        <div className="starfield"></div>
        <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
          <div className="glass card-shadow rounded-3xl p-10 max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="crystal-orb mb-6">
                <div className="orb-glow"></div>
              </div>
              <h1 className="fortune-title text-5xl font-bold mb-4">
                🔮 Future Forecast
              </h1>
              <p className="neon-text text-lg mb-2">What Does Tomorrow Hold?</p>
              <div className="text-xs text-gray-400 mb-4">Powered by Elinity</div>
              <p className="text-gray-300 mt-6 leading-relaxed">
                Welcome, seekers of destiny. Together with ElinityAI, you'll peer into the future 
                and make playful predictions about each other's lives. Will you discover fame? Adventure? 
                A cafe on Mars? The crystal knows all.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <label className="block neon-text font-semibold mb-2">Fortune Seekers ({playerNames.length})</label>
              {playerNames.map((name, i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={`Player ${i + 1} Name`}
                  value={name}
                  onChange={(e) => updatePlayerName(i, e.target.value)}
                  className="prediction-input w-full"
                />
              ))}
              <div className="flex gap-3">
                {playerNames.length < 4 && (
                  <button onClick={addPlayer} className="btn-secondary px-5 py-2 rounded-xl text-sm">
                    + Add Player
                  </button>
                )}
                {playerNames.length > 2 && (
                  <button onClick={removePlayer} className="btn-secondary px-5 py-2 rounded-xl text-sm">
                    − Remove Player
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={startGame}
              disabled={isLoading || playerNames.filter(n => n.trim()).length < 2}
              className="btn-primary w-full py-4 rounded-xl text-lg font-bold disabled:opacity-50"
            >
              {isLoading ? 'Consulting the Crystal...' : '🔮 Begin Forecast'}
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
    const allPredictionsSubmitted = gameSession?.players.every(name => predictions[name]?.trim())

    return (
      <div className="fortune-bg">
        <div className="elinity-badge">ELINITY</div>
        <div className="starfield"></div>
        <div className="min-h-screen p-6 relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="crystal-orb mb-4">
              <div className="orb-glow"></div>
            </div>
            <h1 className="fortune-title text-4xl font-bold">
              🔮 Future Forecast
            </h1>
            <div className="text-xs text-gray-400 mt-2">Powered by Elinity</div>
            <div className="mt-3">
              <div className="round-badge">
                Round {currentRound} of 5
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT/CENTER: Chat Feed */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-strong rounded-2xl p-6">
                <h3 className="text-xl font-semibold neon-text mb-4">📜 The Vision Unfolds</h3>

                <div ref={chatRef} className="chat-feed">
                  {chatFeed.map((entry, i) => {
                    if (entry.type === 'ai') {
                      return (
                        <div key={i} className="ai-message">
                          <div className="text-xs text-purple-400 mb-1 font-semibold">ElinityAI</div>
                          <div className="text-gray-200">{entry.content}</div>
                        </div>
                      )
                    } else if (entry.type === 'question') {
                      return (
                        <div key={i} className="question-card">
                          <div className="text-sm text-cyan-400 mb-2 font-semibold">Round {entry.round} Question</div>
                          <div className="text-xl font-bold text-white neon-text">{entry.content}</div>
                          {entry.target && (
                            <div className="text-sm text-purple-300 mt-2">About: {entry.target}</div>
                          )}
                        </div>
                      )
                    } else if (entry.type === 'player-answer') {
                      return (
                        <div key={i} className="player-answer">
                          <div className="text-xs text-cyan-400 mb-1 font-semibold">{entry.player} predicts:</div>
                          <div className="text-gray-200">"{entry.content}"</div>
                        </div>
                      )
                    } else if (entry.type === 'forecast') {
                      return (
                        <div key={i} className="forecast-result">
                          <div className="text-sm text-purple-400 mb-2 font-semibold">🔮 The Forecast Reveals:</div>
                          <div className="text-lg text-white leading-relaxed">{entry.content}</div>
                          {entry.bonus_twist && (
                            <div className="bonus-twist">
                              <div className="text-xs text-pink-400 mb-1 font-semibold">✨ BONUS TWIST!</div>
                              <div className="text-white">{entry.bonus_twist}</div>
                            </div>
                          )}
                        </div>
                      )
                    }
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: Prediction Input */}
            <div className="space-y-6">
              {/* Players List */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold neon-text mb-3">👥 Fortune Seekers</h3>
                <div className="space-y-2">
                  {gameSession?.players.map((player, i) => (
                    <div key={i} className="player-badge">
                      {player}
                    </div>
                  ))}
                </div>
              </div>

              {/* Prediction Input */}
              {currentQuestion && (
                <div className="glass-strong rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-purple-300 mb-4">
                    🌟 Your Predictions
                  </h3>
                  <div className="text-sm text-gray-400 mb-4">
                    What does the future hold for {currentQuestion.target_player}?
                  </div>

                  <div className="space-y-4">
                    {gameSession.players.map(name => (
                      <div key={name}>
                        <label className="block text-sm text-cyan-400 mb-2 font-semibold">
                          {name}'s vision:
                        </label>
                        <textarea
                          placeholder="Share your prediction..."
                          value={predictions[name] || ''}
                          onChange={(e) => updatePrediction(name, e.target.value)}
                          disabled={isLoading}
                          className="prediction-input w-full resize-none"
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={submitPredictions}
                    disabled={!allPredictionsSubmitted || isLoading}
                    className="btn-primary w-full py-3 rounded-xl font-bold disabled:opacity-50 mt-4"
                  >
                    {isLoading ? '🔮 Consulting...' : '✨ Submit Predictions'}
                  </button>

                  {isLoading && (
                    <div className="text-center text-purple-400 text-sm mt-3 animate-pulse">
                      The crystal reveals...
                    </div>
                  )}
                </div>
              )}

              {/* Next Round Button */}
              {!isLoading && chatFeed.length > 0 && chatFeed[chatFeed.length - 1].type === 'forecast' && (
                <div className="glass rounded-2xl p-6">
                  <button
                    onClick={nextQuestion}
                    className="btn-secondary w-full py-3 rounded-xl font-bold"
                  >
                    {currentRound >= 5 ? '🎯 View Timeline' : '➡️ Next Question'}
                  </button>
                  {currentRound < 5 && (
                    <button
                      onClick={finishGame}
                      className="btn-finish w-full py-3 rounded-xl font-bold mt-3"
                    >
                      🏁 Finish Early
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: TIMELINE COMPLETE
  // ============================================
  if (gameState === 'complete') {
    return (
      <div className="fortune-bg">
        <div className="elinity-badge">ELINITY</div>
        <div className="starfield"></div>
        <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
          <div className="timeline-summary max-w-4xl w-full">
            <div className="text-center mb-8">
              <div className="crystal-orb mb-6">
                <div className="orb-glow"></div>
              </div>
              <h1 className="fortune-title text-5xl font-bold mb-4">
                📜 The Timeline Revealed
              </h1>
              <div className="text-gray-300 text-lg">
                {currentRound} rounds of future visions complete
              </div>
            </div>

            {/* Overall Summary */}
            {timelineSummary?.summary && (
              <div className="forecast-result mb-8">
                <div className="text-lg text-white leading-relaxed">
                  {timelineSummary.summary}
                </div>
              </div>
            )}

            {/* Individual Player Timelines */}
            {timelineSummary?.player_futures && (
              <div className="space-y-4 mb-8">
                <h2 className="text-2xl font-bold neon-text mb-4">🌟 Individual Futures</h2>
                {timelineSummary.player_futures.map((pf, i) => (
                  <div key={i} className="player-timeline">
                    <div className="text-lg font-bold text-cyan-400 mb-2">
                      {pf.player}'s Future
                    </div>
                    <div className="text-gray-200 leading-relaxed">
                      {pf.future_snapshot}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={restart}
              className="btn-primary w-full py-4 rounded-xl text-lg font-bold"
            >
              🔄 Forecast Again
            </button>
          </div>
        </div>
      </div>
    )
  }
}

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function InnerWorldQuest() {
  // Game State
  const [gameState, setGameState] = useState('setup') // 'setup' | 'exploring' | 'complete'
  const [playerName, setPlayerName] = useState('')
  const [narrative, setNarrative] = useState([]) // [{type: 'ai'|'player', content, emotion, timestamp}]
  const [currentPaths, setCurrentPaths] = useState([]) // Available path choices
  const [journeyLog, setJourneyLog] = useState([]) // Visited worlds
  const [emotionsVisited, setEmotionsVisited] = useState([]) // ['joy', 'calm', 'courage']
  const [reflectionInput, setReflectionInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [travelJournal, setTravelJournal] = useState(null) // Final summary
  const [gameSession, setGameSession] = useState(null)

  const narrativeRef = useRef(null)

  // Auto-scroll narrative
  useEffect(() => {
    if (narrativeRef.current) {
      narrativeRef.current.scrollTop = narrativeRef.current.scrollHeight
    }
  }, [narrative])

  // Start Quest
  const startQuest = async () => {
    if (!playerName.trim()) return alert('Please enter your name')

    setIsLoading(true)
    try {
      const response = await axios.post('/api/start_quest', { player_name: playerName })
      const { welcome_message, initial_paths, session } = response.data

      setGameSession(session)
      setCurrentPaths(initial_paths)
      setNarrative([{ type: 'ai', content: welcome_message, timestamp: Date.now() }])
      setGameState('exploring')
    } catch (error) {
      console.error('Start error:', error)
      alert('Error starting quest. Check console.')
    } finally {
      setIsLoading(false)
    }
  }

  // Choose Path/Door
  const choosePath = async (pathChoice) => {
    setIsLoading(true)
    try {
      const response = await axios.post('/api/choose_path', {
        session: gameSession,
        path_choice: pathChoice
      })

      const { landscape_description, emotion_tone, visited_world, session: updatedSession, next_paths } = response.data

      // Add landscape narration
      setNarrative(prev => [...prev, { 
        type: 'ai', 
        content: landscape_description, 
        emotion: emotion_tone,
        timestamp: Date.now() 
      }])

      // Update journey log and emotions
      setJourneyLog(prev => [...prev, visited_world])
      if (emotion_tone && !emotionsVisited.includes(emotion_tone)) {
        setEmotionsVisited(prev => [...prev, emotion_tone])
      }

      setGameSession(updatedSession)
      setCurrentPaths(next_paths)
      setReflectionInput('')
    } catch (error) {
      console.error('Path choice error:', error)
      alert('Error exploring path. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Submit Player Reflection
  const submitReflection = async () => {
    if (!reflectionInput.trim()) return

    const newReflection = { type: 'player', content: reflectionInput, timestamp: Date.now() }
    setNarrative(prev => [...prev, newReflection])

    setIsLoading(true)
    const tempInput = reflectionInput
    setReflectionInput('')

    try {
      const response = await axios.post('/api/player_reflect', {
        session: gameSession,
        reflection: tempInput
      })

      const { ai_response } = response.data

      setNarrative(prev => [...prev, { 
        type: 'ai', 
        content: ai_response, 
        timestamp: Date.now() 
      }])
    } catch (error) {
      console.error('Reflection error:', error)
      setNarrative(prev => [...prev, { 
        type: 'ai', 
        content: '✨ Your words echo through the landscape...', 
        timestamp: Date.now() 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // End Journey
  const endJourney = async () => {
    setIsLoading(true)
    try {
      const response = await axios.post('/api/end_quest', {
        session: gameSession,
        total_worlds: journeyLog.length
      })

      const { travel_journal } = response.data
      setTravelJournal(travel_journal)
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
    setPlayerName('')
    setNarrative([])
    setCurrentPaths([])
    setJourneyLog([])
    setEmotionsVisited([])
    setReflectionInput('')
    setTravelJournal(null)
    setGameSession(null)
  }

  // Emotion icon mapper
  const getEmotionIcon = (emotion) => {
    const icons = {
      joy: '😊',
      calm: '🌊',
      hope: '🌟',
      courage: '🦁',
      wonder: '✨',
      peace: '🕊️',
      love: '💜',
      reflection: '🪞',
      growth: '🌱'
    }
    return icons[emotion] || '🌌'
  }

  // ============================================
  // RENDER: SETUP SCREEN
  // ============================================
  if (gameState === 'setup') {
    return (
      <div className="dreamscape">
        <div className="elinity-badge">ELINITY</div>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass card-shadow rounded-3xl p-10 max-w-2xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
                🌌 Inner World Quest
              </h1>
              <div className="guide-badge text-white text-sm mt-4">
                Guided by ElinityAI ✨
              </div>
              <p className="text-slate-300 mt-6 leading-relaxed narration-text">
                Welcome, traveler. You are about to journey through the landscapes of your inner world — 
                realms of emotion, memory, and imagination. Each path leads to a different emotional landscape. 
                What you discover is yours alone.
              </p>
            </div>

            <div className="space-y-6 mb-6">
              <div>
                <label className="block text-purple-300 font-medium mb-2 narration-text">Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startQuest()}
                  className="w-full px-5 py-3 rounded-xl transition-all"
                />
              </div>
            </div>

            <button
              onClick={startQuest}
              disabled={isLoading || !playerName.trim()}
              className="btn-primary w-full py-4 rounded-xl text-lg font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Opening the Gateway...' : '🌿 Begin Inner Journey'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: EXPLORING (MAIN GAME)
  // ============================================
  if (gameState === 'exploring') {
    return (
      <div className="dreamscape">
        <div className="elinity-badge">ELINITY</div>
        <div className="min-h-screen p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
              🌌 Inner World Quest
            </h1>
            <div className="guide-badge text-white text-sm mt-3">
              Guided by ElinityAI ✨
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT & CENTER: World View + Narrative */}
            <div className="lg:col-span-2 space-y-6">
              {/* World View Panel */}
              <div className="world-view card-shadow">
                <div className="world-view-content">
                  <div className="text-6xl mb-4">🌿</div>
                  <h2 className="text-3xl font-bold text-purple-200 mb-2">
                    {journeyLog.length > 0 ? journeyLog[journeyLog.length - 1].name : 'The Gateway'}
                  </h2>
                  <p className="text-slate-300 text-lg">
                    {journeyLog.length > 0 
                      ? `Worlds Explored: ${journeyLog.length}` 
                      : 'Your journey awaits...'}
                  </p>
                </div>
              </div>

              {/* Narrative Feed */}
              <div className="glass-strong rounded-2xl p-6 card-shadow">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">📖 Your Journey</h3>

                <div ref={narrativeRef} className="story-feed">
                  {narrative.map((entry, i) => {
                    if (entry.type === 'ai') {
                      return (
                        <div key={i} className="landscape-narration">
                          <div className="narration-text">{entry.content}</div>
                          {entry.emotion && (
                            <div className="text-sm text-purple-300 mt-2">
                              {getEmotionIcon(entry.emotion)} {entry.emotion}
                            </div>
                          )}
                        </div>
                      )
                    } else {
                      return (
                        <div key={i} className="reflection-bubble">
                          <div className="text-sm opacity-70 mb-1">{playerName}</div>
                          <div>{entry.content}</div>
                        </div>
                      )
                    }
                  })}
                </div>

                {/* Reflection Input */}
                <div className="mt-4 space-y-3">
                  <label className="text-purple-300 font-medium block">✨ Share Your Reflection</label>
                  <textarea
                    placeholder="What do you see? What do you feel?"
                    value={reflectionInput}
                    onChange={(e) => setReflectionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        submitReflection()
                      }
                    }}
                    disabled={isLoading}
                    className="w-full px-5 py-4 rounded-xl resize-none transition-all"
                    rows={3}
                  />
                  <button
                    onClick={submitReflection}
                    disabled={!reflectionInput.trim() || isLoading}
                    className="btn-secondary w-full py-3 rounded-xl font-medium disabled:opacity-50"
                  >
                    💭 Reflect
                  </button>
                </div>
              </div>

              {/* Path Choices */}
              {currentPaths.length > 0 && (
                <div className="glass-strong rounded-2xl p-6 card-shadow">
                  <h3 className="text-xl font-semibold text-purple-300 mb-4">🚪 Choose Your Next Path</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {currentPaths.map((path, i) => (
                      <button
                        key={i}
                        onClick={() => choosePath(path)}
                        disabled={isLoading}
                        className="path-choice disabled:opacity-50"
                      >
                        <div className="path-choice-content">
                          <div className="text-2xl mb-2">{path.icon}</div>
                          <div className="text-lg font-semibold text-purple-200 mb-1">{path.name}</div>
                          <div className="text-sm text-slate-400">{path.hint}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Journey Log + Emotional Map */}
            <div className="space-y-6">
              {/* Emotional Map */}
              <div className="glass-strong rounded-2xl p-6 card-shadow">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">🗺️ Emotional Map</h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  {['joy', 'calm', 'hope', 'courage', 'wonder', 'peace'].map((emotion) => (
                    <div
                      key={emotion}
                      className={`emotion-icon ${emotion} ${emotionsVisited.includes(emotion) ? 'active' : 'opacity-30'}`}
                      title={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                    >
                      {getEmotionIcon(emotion)}
                    </div>
                  ))}
                </div>
                <div className="text-center text-sm text-slate-400 mt-4">
                  {emotionsVisited.length} emotion{emotionsVisited.length !== 1 ? 's' : ''} discovered
                </div>
              </div>

              {/* Journey Log */}
              <div className="glass-strong rounded-2xl p-6 card-shadow">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">📜 Journey Log</h3>
                {journeyLog.length === 0 ? (
                  <div className="text-slate-400 text-center py-6 text-sm">
                    Your journey begins...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {journeyLog.map((world, i) => (
                      <div key={i} className="journey-entry">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{world.icon}</span>
                          <div className="flex-1">
                            <div className="text-purple-200 font-medium text-sm">{world.name}</div>
                            <div className="text-slate-400 text-xs">{world.emotion}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={endJourney}
                  disabled={isLoading || journeyLog.length === 0}
                  className="btn-end w-full py-3 rounded-xl font-medium disabled:opacity-50"
                >
                  🌙 End Journey
                </button>
                <div className="text-center text-xs text-slate-400">
                  {journeyLog.length} world{journeyLog.length !== 1 ? 's' : ''} explored
                </div>
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
      <div className="dreamscape">
        <div className="elinity-badge">ELINITY</div>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-strong card-shadow rounded-3xl p-10 max-w-3xl w-full journey-complete">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">✨</div>
              <h1 className="text-4xl font-bold text-purple-300 mb-3">
                Journey Complete
              </h1>
              <div className="text-slate-300 narration-text">
                You have traveled through {journeyLog.length} inner world{journeyLog.length !== 1 ? 's' : ''}...
              </div>
            </div>

            {travelJournal && (
              <div className="bg-black/30 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-purple-300 mb-4">📜 Inner Travel Journal</h2>
                <div className="text-slate-200 leading-relaxed whitespace-pre-wrap narration-text">
                  {travelJournal}
                </div>
              </div>
            )}

            {/* Worlds Visited */}
            <div className="bg-black/20 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-purple-300 mb-3">Worlds You Visited:</h3>
              <div className="flex flex-wrap gap-2">
                {journeyLog.map((world, i) => (
                  <div key={i} className="bg-purple-500/20 px-4 py-2 rounded-full text-sm flex items-center gap-2">
                    <span>{world.icon}</span>
                    <span className="text-purple-200">{world.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={restart}
              className="btn-primary w-full py-4 rounded-xl text-lg font-semibold"
            >
              🔄 New Journey
            </button>
          </div>
        </div>
      </div>
    )
  }
}

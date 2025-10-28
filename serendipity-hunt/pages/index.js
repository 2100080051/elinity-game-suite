import { useState } from 'react'
import axios from 'axios'

export default function Home(){
  const [step, setStep] = useState('setup') // setup | hunting | reveal | summary
  const [players, setPlayers] = useState(['', ''])
  const [vibe, setVibe] = useState('casual')
  const [currentClue, setCurrentClue] = useState(null)
  const [guess, setGuess] = useState('')
  const [treasures, setTreasures] = useState([])
  const [currentReveal, setCurrentReveal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [roundCount, setRoundCount] = useState(0)
  const [showReveal, setShowReveal] = useState(false)

  const MAX_ROUNDS = 5

  const vibeOptions = [
    {value: 'casual', label: '😊 Casual Friends', desc: 'Light & fun'},
    {value: 'deep', label: '💭 Deep Dive', desc: 'Meaningful connections'},
    {value: 'team', label: '🤝 Team Building', desc: 'Work colleagues'}
  ]

  const updatePlayer = (index, value) => {
    const updated = [...players]
    updated[index] = value
    setPlayers(updated)
  }

  const addPlayer = () => {
    setPlayers([...players, ''])
  }

  const startHunt = async () => {
    const validPlayers = players.filter(p => p.trim())
    if(validPlayers.length < 2) return

    setLoading(true)
    try{
      const res = await axios.post('/api/start_hunt', {
        players: validPlayers,
        vibe
      })
      setCurrentClue(res.data.clue)
      setStep('hunting')
      setRoundCount(1)
    }catch(err){
      console.error('start_hunt error:', err)
    }finally{
      setLoading(false)
    }
  }

  const submitGuess = async () => {
    if(!guess.trim()) return

    setLoading(true)
    try{
      const res = await axios.post('/api/submit_guess', {
        players: players.filter(p => p.trim()),
        vibe,
        clue: currentClue,
        guess: guess.trim(),
        treasures
      })
      
      setCurrentReveal(res.data)
      setShowReveal(true)
      
      // Add treasure if correct or partially correct
      if(res.data.correct || res.data.partial){
        const newTreasure = {
          id: treasures.length + 1,
          emoji: res.data.gem_emoji || '💎',
          category: res.data.category || 'quirks',
          title: res.data.connection_title || 'Mystery Connection',
          description: res.data.connection_description || guess.trim()
        }
        setTreasures([...treasures, newTreasure])
      }

      setGuess('')
    }catch(err){
      console.error('submit_guess error:', err)
    }finally{
      setLoading(false)
    }
  }

  const nextClue = async () => {
    setShowReveal(false)
    setCurrentReveal(null)

    if(roundCount >= MAX_ROUNDS){
      setStep('summary')
      return
    }

    setLoading(true)
    try{
      const res = await axios.post('/api/get_next_clue', {
        players: players.filter(p => p.trim()),
        vibe,
        treasures
      })
      setCurrentClue(res.data.clue)
      setRoundCount(roundCount + 1)
    }catch(err){
      console.error('get_next_clue error:', err)
    }finally{
      setLoading(false)
    }
  }

  const resetGame = () => {
    setStep('setup')
    setPlayers(['', ''])
    setVibe('casual')
    setCurrentClue(null)
    setGuess('')
    setTreasures([])
    setCurrentReveal(null)
    setRoundCount(0)
    setShowReveal(false)
  }

  const getCategoryColor = (category) => {
    const colors = {
      hobbies: 'gem-hobbies',
      habits: 'gem-habits',
      memories: 'gem-memories',
      quirks: 'gem-quirks'
    }
    return colors[category] || 'gem-quirks'
  }

  const validPlayers = players.filter(p => p.trim())

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="elinity-badge">ELINITY</div>
      
      {/* SETUP */}
      {step === 'setup' && (
        <div className="max-w-2xl mx-auto glass card-shadow rounded-3xl p-8 text-white">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-extrabold mb-3">🗺️ Serendipity Hunt</h1>
            <p className="text-lg text-white/80">Discover hidden treasures of connection between you</p>
          </div>

          <div className="parchment rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">🧭 Enter Players</h3>
            <div className="space-y-3 mb-4">
              {players.map((player, i) => (
                <input 
                  key={i}
                  className="w-full px-4 py-3 rounded-xl" 
                  placeholder={`Player ${i + 1} name`}
                  value={player}
                  onChange={e => updatePlayer(i, e.target.value)}
                />
              ))}
            </div>
            {players.length < 6 && (
              <button onClick={addPlayer} className="w-full py-2 rounded-xl font-semibold btn-secondary">
                + Add Another Player
              </button>
            )}
          </div>

          <div className="parchment rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">🎭 Choose Vibe</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {vibeOptions.map(opt => (
                <button 
                  key={opt.value}
                  onClick={() => setVibe(opt.value)}
                  className={`p-4 rounded-xl text-center transition-all ${
                    vibe === opt.value 
                      ? 'bg-amber-600/40 border-2 border-amber-500' 
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{opt.label.split(' ')[0]}</div>
                  <div className="font-semibold text-sm">{opt.label.substring(3)}</div>
                  <div className="text-xs text-white/60 mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={startHunt} 
            disabled={loading || validPlayers.length < 2}
            className="w-full py-4 rounded-xl font-semibold text-lg btn-primary disabled:opacity-50"
          >
            {loading ? 'Preparing Hunt...' : '🔍 Begin the Hunt'}
          </button>
        </div>
      )}

      {/* HUNTING */}
      {step === 'hunting' && (
        <div className="max-w-4xl mx-auto">
          <div className="glass card-shadow rounded-3xl p-6 text-white mb-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">🗺️ Treasure Hunt</h2>
                <div className="text-white/70">
                  {validPlayers.map((p, i) => (
                    <span key={i} className="player-badge mr-2">{p}</span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-amber-400">{treasures.length}</div>
                <div className="text-sm text-white/70">Treasures Found</div>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-white/70 mb-2">
                <span>Round {roundCount} of {MAX_ROUNDS}</span>
                <span>{MAX_ROUNDS - roundCount} clues remaining</span>
              </div>
              <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                  style={{width: `${(roundCount / MAX_ROUNDS) * 100}%`}}
                />
              </div>
            </div>

            {/* Current Clue */}
            {currentClue && !showReveal && (
              <div className="clue-box mb-6 mystery">
                <div className="text-xl font-semibold text-amber-100">
                  {currentClue}
                </div>
              </div>
            )}

            {/* Reveal */}
            {showReveal && currentReveal && (
              <div className={`parchment rounded-2xl p-6 mb-6 ${currentReveal.correct ? 'reveal-animation' : ''}`}>
                <div className="text-center mb-4">
                  <div className="text-6xl mb-3">
                    {currentReveal.correct ? '✨' : currentReveal.partial ? '🤔' : '💡'}
                  </div>
                  <div className="text-2xl font-bold mb-2">
                    {currentReveal.correct ? 'Treasure Unlocked!' : currentReveal.partial ? 'Almost There!' : 'Not Quite...'}
                  </div>
                </div>

                {currentReveal.connection_title && (
                  <div className="summary-box">
                    <div className="font-bold text-lg mb-2 text-emerald-300">
                      {currentReveal.connection_title}
                    </div>
                    <div className="text-white/90">
                      {currentReveal.connection_description}
                    </div>
                  </div>
                )}

                {currentReveal.feedback && (
                  <div className="text-center text-white/80 mt-4 italic">
                    {currentReveal.feedback}
                  </div>
                )}

                <div className="text-center mt-6">
                  <button 
                    onClick={nextClue} 
                    disabled={loading}
                    className="px-8 py-3 rounded-xl font-semibold btn-guess disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : roundCount >= MAX_ROUNDS ? '📊 View Treasure Map' : '➡️ Next Clue'}
                  </button>
                </div>
              </div>
            )}

            {/* Guess Input */}
            {!showReveal && (
              <div className="space-y-3">
                <textarea 
                  className="w-full px-4 py-3 rounded-xl" 
                  placeholder="What's the connection? Make your guess..."
                  rows={3}
                  value={guess}
                  onChange={e => setGuess(e.target.value)}
                  onKeyPress={e => {
                    if(e.key === 'Enter' && !e.shiftKey){
                      e.preventDefault()
                      submitGuess()
                    }
                  }}
                />
                <div className="flex gap-3">
                  <button 
                    onClick={submitGuess} 
                    disabled={loading || !guess.trim()}
                    className="flex-1 py-3 rounded-xl font-semibold btn-guess disabled:opacity-50"
                  >
                    {loading ? 'Checking...' : '🔍 Submit Guess'}
                  </button>
                  <button 
                    onClick={nextClue}
                    disabled={loading}
                    className="px-6 py-3 rounded-xl font-semibold btn-secondary disabled:opacity-50"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Treasure Chest */}
          {treasures.length > 0 && (
            <div className="glass card-shadow rounded-3xl p-6 text-white">
              <h3 className="text-2xl font-bold mb-4">💎 Treasure Chest</h3>
              <div className="treasure-chest">
                {treasures.map(treasure => (
                  <div 
                    key={treasure.id}
                    className={`gem unlocked ${getCategoryColor(treasure.category)}`}
                    title={treasure.description}
                  >
                    <div className="text-3xl">{treasure.emoji}</div>
                    <div className="text-xs font-semibold text-white mt-1 text-center px-1">
                      {treasure.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUMMARY */}
      {step === 'summary' && (
        <div className="max-w-3xl mx-auto glass card-shadow rounded-3xl p-8 text-white">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold mb-3">🗺️ Your Treasure Map</h1>
            <p className="text-lg text-white/80">You discovered {treasures.length} hidden connections!</p>
          </div>

          {treasures.length > 0 ? (
            <>
              {/* Treasure Grid */}
              <div className="treasure-chest mb-8">
                {treasures.map(treasure => (
                  <div 
                    key={treasure.id}
                    className={`gem unlocked ${getCategoryColor(treasure.category)}`}
                  >
                    <div className="text-3xl">{treasure.emoji}</div>
                    <div className="text-xs font-semibold text-white mt-1 text-center px-1">
                      {treasure.title}
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed List */}
              <div className="space-y-3 mb-8">
                {treasures.map(treasure => (
                  <div key={treasure.id} className="parchment rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{treasure.emoji}</div>
                      <div className="flex-1">
                        <div className="font-bold text-lg text-amber-300">{treasure.title}</div>
                        <div className="text-white/80 text-sm mt-1">{treasure.description}</div>
                        <div className="text-xs text-white/60 mt-2 capitalize">
                          Category: {treasure.category}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-white/60 mb-8">
              No treasures found this time. Try again!
            </div>
          )}

          <div className="summary-box mb-6">
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">
                🎉 You've uncovered the hidden threads that connect you!
              </div>
              <div className="text-white/80">
                These shared moments, quirks, and interests are the treasures of friendship.
              </div>
            </div>
          </div>

          <button 
            onClick={resetGame}
            className="w-full py-4 rounded-xl font-semibold text-lg btn-primary"
          >
            🔄 New Hunt
          </button>
        </div>
      )}
    </div>
  )
}

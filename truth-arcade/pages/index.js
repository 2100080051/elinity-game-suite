import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function Home(){
  const [step, setStep] = useState('setup') // setup | playing | summary
  const [players, setPlayers] = useState(['', ''])
  const [gameState, setGameState] = useState(null)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [chatLog, setChatLog] = useState([])
  const [loading, setLoading] = useState(false)
  const chatRef = useRef(null)

  const MAX_ROUNDS = 10

  const updatePlayer = (index, value) => {
    const updated = [...players]
    updated[index] = value
    setPlayers(updated)
  }

  const addPlayer = () => {
    if(players.length < 4) setPlayers([...players, ''])
  }

  const startGame = async () => {
    const validPlayers = players.filter(p => p.trim())
    if(validPlayers.length < 2) return

    setLoading(true)
    try{
      const res = await axios.post('/api/start_game', {
        players: validPlayers
      })
      setGameState(res.data.game_state)
      setChatLog([
        {type: 'ai', text: res.data.welcome},
        {type: 'ai', text: res.data.first_question}
      ])
      setStep('playing')
    }catch(err){
      console.error('start_game error:', err)
    }finally{
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if(!currentAnswer.trim() || loading) return

    const answer = currentAnswer.trim()
    setCurrentAnswer('')

    // Add player answer to chat
    setChatLog([...chatLog, {
      type: 'player',
      player: gameState.players[gameState.current_player_index].name,
      text: answer
    }])

    setLoading(true)
    try{
      const res = await axios.post('/api/submit_answer', {
        game_state: gameState,
        answer
      })
      
      setGameState(res.data.game_state)
      
      const newMessages = [
        {type: 'ai', text: res.data.comment}
      ]

      if(res.data.game_state.round > MAX_ROUNDS || res.data.game_over){
        setStep('summary')
      } else if(res.data.next_question){
        newMessages.push({type: 'ai', text: res.data.next_question})
      }

      setChatLog([...chatLog, 
        {type: 'player', player: gameState.players[gameState.current_player_index].name, text: answer},
        ...newMessages
      ])
    }catch(err){
      console.error('submit_answer error:', err)
    }finally{
      setLoading(false)
    }
  }

  const passQuestion = async () => {
    if(loading) return

    setChatLog([...chatLog, {
      type: 'pass',
      player: gameState.players[gameState.current_player_index].name,
      text: '(Passed on this question)'
    }])

    setLoading(true)
    try{
      const res = await axios.post('/api/pass_question', {
        game_state: gameState
      })
      
      setGameState(res.data.game_state)
      
      const newMessages = [
        {type: 'ai', text: res.data.comment}
      ]

      if(res.data.game_state.round > MAX_ROUNDS || res.data.game_over){
        setStep('summary')
      } else if(res.data.next_question){
        newMessages.push({type: 'ai', text: res.data.next_question})
      }

      setChatLog([...chatLog,
        {type: 'pass', player: gameState.players[gameState.current_player_index].name, text: '(Passed on this question)'},
        ...newMessages
      ])
    }catch(err){
      console.error('pass_question error:', err)
    }finally{
      setLoading(false)
    }
  }

  const endGame = async () => {
    setLoading(true)
    try{
      const res = await axios.post('/api/end_game', {game_state: gameState})
      setChatLog([...chatLog, {type: 'ai', text: res.data.summary}])
      setStep('summary')
    }catch(err){
      console.error('end_game error:', err)
    }finally{
      setLoading(false)
    }
  }

  const resetGame = () => {
    setStep('setup')
    setPlayers(['', ''])
    setGameState(null)
    setCurrentAnswer('')
    setChatLog([])
  }

  useEffect(() => {
    if(chatRef.current){
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [chatLog])

  const getQuestionLevel = () => {
    if(!gameState) return 'light'
    if(gameState.round <= 2) return 'light'
    if(gameState.round <= 5) return 'medium'
    return 'deep'
  }

  const getLevelLabel = (level) => {
    const labels = {
      light: '🌟 Light & Fun',
      medium: '🎯 Getting Personal',
      deep: '💭 Deep Thoughts'
    }
    return labels[level] || labels.light
  }

  const getLevelClass = (level) => {
    const classes = {
      light: 'level-light',
      medium: 'level-medium',
      deep: 'level-deep'
    }
    return classes[level] || classes.light
  }

  const validPlayers = players.filter(p => p.trim())
  const currentLevel = getQuestionLevel()

  return (
    <div className="min-h-screen p-4">
      <div className="elinity-badge">ELINITY</div>
      
      {/* SETUP */}
      {step === 'setup' && (
        <div className="max-w-2xl mx-auto glass card-shadow rounded-3xl p-8 text-white">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              🎯 Truth Arcade
            </h1>
            <p className="text-lg text-white/80">Powered by ElinityAI</p>
            <p className="text-sm text-white/60 mt-2">Gamified truth-telling with escalating questions</p>
          </div>

          <div className="glass-strong rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">👥 Add Players (2-4)</h3>
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
            {players.length < 4 && (
              <button onClick={addPlayer} className="w-full py-2 rounded-xl font-semibold btn-secondary">
                + Add Player
              </button>
            )}
          </div>

          <div className="glass-strong rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold mb-3">📋 How It Works</h3>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>• Answer questions to earn 🪙 Truth Tokens</li>
              <li>• Pass a question to lose 1 token</li>
              <li>• Questions get deeper as rounds progress</li>
              <li>• Most honest player wins!</li>
            </ul>
          </div>

          <button 
            onClick={startGame} 
            disabled={loading || validPlayers.length < 2}
            className="w-full py-4 rounded-xl font-semibold text-lg btn-primary disabled:opacity-50"
          >
            {loading ? 'Starting...' : '🎮 Start Game'}
          </button>
        </div>
      )}

      {/* PLAYING */}
      {step === 'playing' && gameState && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel - Chat Arena */}
          <div className="lg:col-span-2 glass card-shadow rounded-3xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">💬 Question Arena</h2>
              <div className="elinity-badge">
                <span>🤖</span>
                <span>ElinityAI</span>
              </div>
            </div>

            {/* Chat Log */}
            <div ref={chatRef} className="chat-area">
              {chatLog.map((msg, i) => (
                <div key={i}>
                  {msg.type === 'ai' && (
                    <div className="bubble-ai">
                      <div className="font-semibold text-xs mb-1 opacity-80">ElinityAI</div>
                      <div>{msg.text}</div>
                    </div>
                  )}
                  {msg.type === 'player' && (
                    <div className="bubble-player">
                      <div className="font-semibold text-xs mb-1 opacity-80 text-right">{msg.player}</div>
                      <div>{msg.text}</div>
                    </div>
                  )}
                  {msg.type === 'pass' && (
                    <div className="bubble-pass">
                      <div className="font-semibold text-xs mb-1 opacity-80 text-right">{msg.player}</div>
                      <div className="italic">{msg.text}</div>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="bubble-ai">
                  <div className="font-semibold text-xs mb-1 opacity-80">ElinityAI</div>
                  <div className="italic">Thinking...</div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="space-y-3">
              <textarea 
                className="w-full px-4 py-3 rounded-xl" 
                placeholder="Type your answer..."
                rows={3}
                value={currentAnswer}
                onChange={e => setCurrentAnswer(e.target.value)}
                onKeyPress={e => {
                  if(e.key === 'Enter' && !e.shiftKey){
                    e.preventDefault()
                    submitAnswer()
                  }
                }}
                disabled={loading}
              />
              <div className="flex gap-3">
                <button 
                  onClick={submitAnswer} 
                  disabled={loading || !currentAnswer.trim()}
                  className="flex-1 py-3 rounded-xl font-semibold btn-answer disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : '📣 Answer'}
                </button>
                <button 
                  onClick={passQuestion}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-semibold btn-pass disabled:opacity-50"
                >
                  ⏭️ Pass
                </button>
                <button 
                  onClick={endGame}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-semibold btn-end disabled:opacity-50"
                >
                  🛑 End
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Dashboard */}
          <div className="space-y-6">
            
            {/* Current Turn */}
            <div className="glass card-shadow rounded-3xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4">🎯 Current Turn</h3>
              <div className="current-player">
                <div className="text-2xl font-bold mb-2">
                  {gameState.players[gameState.current_player_index].name}
                </div>
                <div className="text-white/70 text-sm">
                  Round {gameState.round} of {MAX_ROUNDS}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm text-white/70 mb-2">Question Level:</div>
                <div className={getLevelClass(currentLevel)}>
                  {getLevelLabel(currentLevel)}
                </div>
              </div>
            </div>

            {/* Player Scores */}
            <div className="glass card-shadow rounded-3xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4">🏆 Leaderboard</h3>
              {gameState.players
                .sort((a, b) => b.tokens - a.tokens)
                .map((player, i) => (
                  <div 
                    key={player.name}
                    className={`player-card ${
                      gameState.current_player_index === gameState.players.findIndex(p => p.name === player.name)
                        ? ''
                        : 'inactive'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{player.name}</div>
                        {i === 0 && gameState.round > 2 && (
                          <div className="text-xs text-yellow-400">👑 Leading</div>
                        )}
                      </div>
                      <div className="token-display">
                        <span className="token-icon">🪙</span>
                        <span>{player.tokens}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Progress */}
            <div className="glass card-shadow rounded-3xl p-6 text-white">
              <h3 className="text-lg font-bold mb-3">📊 Progress</h3>
              <div className="mb-2 flex justify-between text-sm text-white/70">
                <span>Round {gameState.round}</span>
                <span>{MAX_ROUNDS - gameState.round} left</span>
              </div>
              <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{width: `${(gameState.round / MAX_ROUNDS) * 100}%`}}
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUMMARY */}
      {step === 'summary' && gameState && (
        <div className="max-w-3xl mx-auto glass card-shadow rounded-3xl p-8 text-white">
          <div className="summary-modal">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold mb-3">🎯 Game Over!</h1>
              <div className="elinity-badge justify-center mb-4">
                <span>🤖</span>
                <span>ElinityAI Summary</span>
              </div>
            </div>

            {/* Winner */}
            <div className="glass-strong rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">🏆 Most Honest Player</h3>
              {gameState.players
                .sort((a, b) => b.tokens - a.tokens)
                .map((player, i) => (
                  <div key={player.name} className={`leaderboard-item ${i === 0 ? 'winner' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎯'}</div>
                      <div>
                        <div className="font-bold">{player.name}</div>
                        {i === 0 && <div className="text-xs text-yellow-400">Champion of Truth!</div>}
                      </div>
                    </div>
                    <div className="token-display">
                      <span className="token-icon">🪙</span>
                      <span>{player.tokens}</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Final AI Comment */}
            {chatLog.length > 0 && chatLog[chatLog.length - 1].type === 'ai' && (
              <div className="glass-strong rounded-2xl p-6 mb-6">
                <div className="font-semibold mb-2">💬 Final Words:</div>
                <div className="text-white/90 italic">
                  {chatLog[chatLog.length - 1].text}
                </div>
              </div>
            )}

            <button 
              onClick={resetGame}
              className="w-full py-4 rounded-xl font-semibold text-lg btn-primary"
            >
              🔄 Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

export default function TheAlignmentGame(){
  const [gameState, setGameState] = useState('setup') // setup | playing | result | final
  const [playerNames, setPlayerNames] = useState(['', ''])
  const [session, setSession] = useState(null)
  const [chat, setChat] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [choices, setChoices] = useState([]) // Array of choice options
  const [playerChoices, setPlayerChoices] = useState({}) // {playerName: choiceIndex}
  const [roundResult, setRoundResult] = useState(null) // {alignmentScore, comment, breakdown}
  const [roundScores, setRoundScores] = useState([]) // Track all round scores
  const [currentRound, setCurrentRound] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const chatRef = useRef(null)
  const confettiRef = useRef(null)

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [chat])

  const updatePlayerName = (i, v) => {
    const arr = [...playerNames]; arr[i] = v; setPlayerNames(arr)
  }
  const addPlayer = () => { if (playerNames.length < 6) setPlayerNames([...playerNames, '']) }
  const removePlayer = () => { if (playerNames.length > 2) setPlayerNames(playerNames.slice(0, -1)) }

  const startGame = async () => {
    const players = playerNames.map(s => s.trim()).filter(Boolean)
    if (players.length < 2) return alert('Need at least 2 players')
    setIsLoading(true)
    try{
      const res = await axios.post('/api/start_game', { players })
      const { greeting, question, choices: opts, session: newSession } = res.data
      setSession(newSession)
      setChat([{ type:'ai', content: greeting }])
      setCurrentQuestion(question)
      setChoices(opts)
      const init = {}; players.forEach(p => init[p] = null)
      setPlayerChoices(init)
      setCurrentRound(1)
      setGameState('playing')
    }catch(e){
      console.error(e)
      setSession({ players, rounds: [] })
      setChat([{ type:'ai', content: 'Welcome to The Alignment Game! Let\'s see how in-sync your vibes really are.' }])
      setCurrentQuestion('Beach or Mountains?')
      setChoices(['🏖️ Beach', '⛰️ Mountains'])
      const init = {}; players.forEach(p => init[p] = null)
      setPlayerChoices(init)
      setCurrentRound(1)
      setGameState('playing')
    }finally{ setIsLoading(false) }
  }

  const selectChoice = (player, index) => {
    setPlayerChoices(prev => ({ ...prev, [player]: index }))
  }

  const submitAnswers = async () => {
    const players = session.players
    const allAnswered = players.every(p => playerChoices[p] !== null)
    if (!allAnswered) return alert('All players must choose!')

    setIsLoading(true)
    setChat(prev => [...prev, { type:'question', content: currentQuestion }])

    try{
      const res = await axios.post('/api/submit_answers', {
        session,
        question: currentQuestion,
        choices,
        playerChoices,
        round: currentRound
      })
      const { alignmentScore, comment, breakdown, session: updated } = res.data
      setSession(updated)
      setRoundResult({ alignmentScore, comment, breakdown })
      setRoundScores(prev => [...prev, alignmentScore])
      setChat(prev => [...prev, { type:'result', content: comment }])
      setGameState('result')

      // Confetti on high alignment
      if (alignmentScore >= 90) launchConfetti()
    }catch(e){
      console.error(e)
      // Mock result
      const choiceCount = {}
      players.forEach(p => {
        const c = choices[playerChoices[p]]
        choiceCount[c] = (choiceCount[c] || 0) + 1
      })
      const maxCount = Math.max(...Object.values(choiceCount))
      const alignmentScore = Math.round((maxCount / players.length) * 100)
      const comment = alignmentScore >= 80 ? 'Wow! You\'re practically sharing a brain!' : alignmentScore >= 50 ? 'Pretty aligned with a sprinkle of variety!' : 'A beautiful chaos of opinions!'
      setRoundResult({ alignmentScore, comment, breakdown: choiceCount })
      setRoundScores(prev => [...prev, alignmentScore])
      setChat(prev => [...prev, { type:'result', content: comment }])
      setGameState('result')
      if (alignmentScore >= 90) launchConfetti()
    }finally{
      setIsLoading(false)
    }
  }

  const launchConfetti = () => {
    if (!confettiRef.current) return
    const canvas = confettiRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#ff6b9d','#4ade80','#38bdf8','#fbbf24','#a78bfa']
    const N = 120
    const parts = Array.from({ length: N }).map(() => ({
      x: Math.random() * canvas.width,
      y: -20 + Math.random() * -50,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 2 + 2,
      g: 0.12,
      s: 6 + Math.random() * 6,
      r: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      c: colors[Math.floor(Math.random() * colors.length)]
    }))

    let t = 0
    const ttl = 120
    const draw = () => {
      t++
      ctx.clearRect(0,0,canvas.width, canvas.height)
      parts.forEach(p => {
        p.vy += p.g
        p.x += p.vx
        p.y += p.vy
        p.r += p.vr

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.r)
        ctx.fillStyle = p.c
        ctx.fillRect(-p.s*0.5, -p.s*0.5, p.s, p.s)
        ctx.restore()
      })
      if (t < ttl && parts.some(p => p.y < canvas.height)) requestAnimationFrame(draw)
      else ctx.clearRect(0,0,canvas.width, canvas.height)
    }
    requestAnimationFrame(draw)
  }

  const nextRound = async () => {
    setIsLoading(true)
    setGameState('playing')
    setRoundResult(null)
    try{
      const res = await axios.post('/api/next_question', { session, round: currentRound })
      const { question, choices: opts, session: updated } = res.data
      setSession(updated)
      setCurrentQuestion(question)
      setChoices(opts)
      const init = {}; session.players.forEach(p => init[p] = null)
      setPlayerChoices(init)
      setCurrentRound(prev => prev + 1)
    }catch(e){
      console.error(e)
      setCurrentQuestion('Coffee or Tea?')
      setChoices(['☕ Coffee', '🍵 Tea'])
      const init = {}; session.players.forEach(p => init[p] = null)
      setPlayerChoices(init)
      setCurrentRound(prev => prev + 1)
    }finally{ setIsLoading(false) }
  }

  const endGame = async () => {
    setIsLoading(true)
    try{
      const res = await axios.post('/api/final_summary', { session, roundScores })
      const { overallScore, verdict, summary } = res.data
      setChat(prev => [...prev, { type:'final', content: `${verdict}\n\n${summary}` }])
      setSession(prev => ({ ...prev, overallScore, verdict }))
      setGameState('final')
    }catch(e){
      const avg = Math.round(roundScores.reduce((a,b)=>a+b,0) / roundScores.length)
      const verdict = avg >= 80 ? 'Cosmic Harmony! 🌟' : avg >= 60 ? 'Mostly in Sync 🎶' : avg >= 40 ? 'Beautifully Diverse 🌈' : 'Chaos Energy! 🎉'
      setChat(prev => [...prev, { type:'final', content: `Your overall alignment is ${avg}% — ${verdict}` }])
      setGameState('final')
    }finally{ setIsLoading(false) }
  }

  // UI - Setup
  if (gameState === 'setup'){
    return (
      <div className="party-mode min-h-screen flex items-center justify-center p-6">
        <div className="elinity-badge">ELINITY</div>
        <canvas ref={confettiRef} className="confetti-canvas" />
        <div className="glass-strong rounded-3xl p-10 max-w-2xl w-full relative z-10">
          <div className="text-center mb-6">
            <div className="emoji-big">🎯</div>
            <h1 className="game-title text-5xl mt-4">The Alignment Game</h1>
            <div className="subtitle mt-2">Are You in Sync?</div>
            <div className="text-xs text-slate-500 mt-2">Powered by Elinity</div>
          </div>

          <div className="space-y-4 mb-6">
            <label className="block font-semibold text-slate-700">Players ({playerNames.length})</label>
            {playerNames.map((n,i) => (
              <input key={i} value={n} onChange={e=>updatePlayerName(i, e.target.value)} className="input-box w-full" placeholder={`Player ${i+1} Name`} />
            ))}
            <div className="flex gap-3">
              {playerNames.length < 6 && <button onClick={addPlayer} className="btn-secondary px-4 py-2 rounded-xl">+ Add Player</button>}
              {playerNames.length > 2 && <button onClick={removePlayer} className="btn-secondary px-4 py-2 rounded-xl">− Remove Player</button>}
            </div>
          </div>

          <button onClick={startGame} disabled={isLoading || playerNames.filter(n=>n.trim()).length<2} className="btn-primary w-full py-4 rounded-xl text-lg disabled:opacity-50">
            {isLoading ? 'Starting…' : '🚀 Start Game'}
          </button>
        </div>
      </div>
    )
  }

  // UI - Playing
  if (gameState === 'playing'){
    const allChosen = session?.players?.every(p => playerChoices[p] !== null)
    return (
      <div className="party-mode min-h-screen p-6">
        <div className="elinity-badge">ELINITY</div>
        <canvas ref={confettiRef} className="confetti-canvas" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="game-title text-3xl">🎯 The Alignment Game</h2>
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-500">Powered by Elinity</div>
              <div className="round-badge">Round {currentRound}</div>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-8 mb-6">
            <div className="text-center mb-8">
              <div className="text-3xl font-bold text-slate-800 mb-4">{currentQuestion}</div>
              <div className="text-sm text-slate-600">Everyone choose your answer!</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {choices.map((choice, idx) => {
                const selectedBy = Object.keys(playerChoices).filter(p => playerChoices[p] === idx)
                return (
                  <div key={idx} className="space-y-2">
                    <button
                      className={`btn-choice w-full py-4 rounded-2xl text-lg ${selectedBy.length > 0 ? 'selected' : ''}`}
                      disabled={true}
                    >
                      {choice}
                    </button>
                    {selectedBy.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {selectedBy.map(p => <span key={p} className="player-badge text-xs">{p}</span>)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="space-y-3 mb-6">
              {session?.players?.map(player => (
                <div key={player} className="glass rounded-xl p-4">
                  <div className="font-bold text-slate-700 mb-2">{player}'s Choice:</div>
                  <div className="flex gap-3">
                    {choices.map((choice, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectChoice(player, idx)}
                        className={`btn-choice flex-1 py-3 rounded-xl text-sm ${playerChoices[player] === idx ? 'selected' : ''}`}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={submitAnswers} disabled={!allChosen || isLoading} className="btn-primary w-full py-4 rounded-xl text-lg disabled:opacity-50">
              {isLoading ? 'Calculating…' : '✅ Submit All Answers'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // UI - Result
  if (gameState === 'result'){
    return (
      <div className="party-mode min-h-screen p-6 flex items-center justify-center">
        <div className="elinity-badge">ELINITY</div>
        <canvas ref={confettiRef} className="confetti-canvas" />
        <div className="glass-strong rounded-3xl p-10 max-w-3xl w-full relative z-10">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{roundResult.alignmentScore >= 80 ? '🎉' : roundResult.alignmentScore >= 50 ? '😊' : '🎨'}</div>
            <h2 className="game-title text-4xl mb-4">Round {currentRound} Results</h2>
            <div className="verdict mb-4">{roundResult.alignmentScore}% Aligned</div>
            <p className="text-xl text-slate-700 italic">"{roundResult.comment}"</p>
          </div>

          <div className="mb-8">
            <div className="text-sm font-bold text-slate-600 mb-2 text-center">Alignment Meter</div>
            <div className="sync-meter">
              <div className="sync-fill" style={{ width: `${roundResult.alignmentScore}%` }} />
            </div>
          </div>

          <div className="result-card mb-8">
            <div className="font-bold text-slate-800 mb-3">Choice Breakdown:</div>
            <div className="choice-breakdown">
              {Object.entries(roundResult.breakdown || {}).map(([choice, count]) => {
                const isWinner = count === Math.max(...Object.values(roundResult.breakdown))
                return (
                  <div key={choice} className={`choice-bar ${isWinner ? 'winner' : ''}`}>
                    <div className="text-2xl mb-1">{count}</div>
                    <div className="text-xs text-slate-600">{choice}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={nextRound} disabled={isLoading} className="btn-primary flex-1 py-4 rounded-xl text-lg disabled:opacity-50">
              {isLoading ? 'Loading…' : '➡️ Next Question'}
            </button>
            <button onClick={endGame} disabled={isLoading} className="btn-secondary flex-1 py-4 rounded-xl text-lg disabled:opacity-50">
              🏁 End Game
            </button>
          </div>
        </div>
      </div>
    )
  }

  // UI - Final
  const avgScore = roundScores.length ? Math.round(roundScores.reduce((a,b)=>a+b,0) / roundScores.length) : 0
  return (
    <div className="party-mode min-h-screen p-6 flex items-center justify-center">
      <div className="elinity-badge">ELINITY</div>
      <canvas ref={confettiRef} className="confetti-canvas" />
      <div className="glass-strong rounded-3xl p-10 max-w-3xl w-full relative z-10 text-center">
        <div className="emoji-big mb-4">🏆</div>
        <h2 className="game-title text-5xl mb-4">Final Results</h2>
        <div className="verdict mb-6">{avgScore}% Overall Alignment</div>
        <p className="text-xl text-slate-700 mb-8">{session?.verdict || 'What a journey!'}</p>

        <div className="glass rounded-2xl p-6 mb-8">
          <div className="font-bold text-slate-800 mb-4">Round-by-Round Scores:</div>
          <div className="flex justify-center gap-3 flex-wrap">
            {roundScores.map((score, i) => (
              <div key={i} className="player-badge">R{i+1}: {score}%</div>
            ))}
          </div>
        </div>

        <button onClick={()=>{ setGameState('setup'); setPlayerNames(['','']); setSession(null); setChat([]); setRoundScores([]); setCurrentRound(0); }} className="btn-primary px-8 py-4 rounded-xl text-lg">
          🔁 Play Again
        </button>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

export default function Home(){
  const [gameStarted, setGameStarted] = useState(false)
  const [round, setRound] = useState(0)
  const [MAX_ROUNDS] = useState(7)
  const [players] = useState(['Player 1','Player 2'])
  const [actor, setActor] = useState('Player 1')
  const [secretPrompt, setSecretPrompt] = useState('')
  const [promptVisible, setPromptVisible] = useState(false)
  const [guesses, setGuesses] = useState([]) // { by, text, correct, hint }
  const [guessInput, setGuessInput] = useState('')
  const [score, setScore] = useState({ 'Player 1': 0, 'Player 2': 0 })
  const [history, setHistory] = useState([]) // rounds played
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const scrollRef = useRef(null)

  useEffect(()=>{ if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [guesses])

  async function startGame(){
    setGameStarted(true)
    await nextRound('Player 1')
  }

  async function nextRound(nextActor){
    setLoading(true)
    try{
      const res = await axios.post('/api/next_prompt', { round: round+1, actor: nextActor })
      setSecretPrompt(res.data.prompt || 'Act out HOPEFUL 🎭')
      setPromptVisible(false)
      setGuesses([])
      setGuessInput('')
      setActor(nextActor)
      setRound(r => r+1)
      setMessage('New round! Only the actor should peek the secret prompt.')
    }catch(e){
      alert('Error getting prompt: ' + (e.response?.data?.error || e.message))
    }finally{ setLoading(false) }
  }

  async function submitGuess(by){
    if (!guessInput.trim()) return
    const text = guessInput.trim()
    setGuessInput('')

    try{
      const res = await axios.post('/api/check_guess', { target: secretPrompt, guess: text })
      const correct = !!res.data?.correct
      const hint = res.data?.hint || ''
      const newGuess = { by, text, correct, hint }
      setGuesses(g => [...g, newGuess])

      if (correct){
        setMessage('Correct! 🎉')
        // Points for the guesser (if different from actor)
        if (by !== actor){ setScore(s => ({...s, [by]: (s[by]||0)+1 })) }
      }else{
        setMessage(hint ? `Hint: ${hint}` : 'Not quite — try again!')
      }
    }catch(e){
      alert('Error checking guess: ' + (e.response?.data?.error || e.message))
    }
  }

  async function revealAndRotate(){
    // optional call: await axios.post('/api/reveal', { target: secretPrompt })
    setHistory(h => [...h, { round, actor, prompt: secretPrompt, guesses }])
    const nextActor = actor === 'Player 1' ? 'Player 2' : 'Player 1'
    if (round >= MAX_ROUNDS){
      await endGame()
    } else {
      await nextRound(nextActor)
    }
  }

  async function endGame(){
    setLoading(true)
    try{
      const res = await axios.post('/api/end_game', { history, score })
      const wrap = res.data?.reflection || 'Great acting and guessing! 🎭'
      setMessage(wrap)
    }catch(e){
      setMessage('Great acting and guessing! 🎭')
    }finally{ setLoading(false) }
  }

  function newGame(){
    setGameStarted(false)
    setRound(0)
    setActor('Player 1')
    setSecretPrompt('')
    setPromptVisible(false)
    setGuesses([])
    setGuessInput('')
    setScore({ 'Player 1': 0, 'Player 2': 0 })
    setHistory([])
    setMessage('')
  }

  return (
    <div className="min-h-screen flex">
      <div className="elinity-badge">ELINITY</div>
      {/* Sidebar */}
      <aside className="w-20 p-4 flex flex-col items-center space-y-6 glass-strong card-shadow">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-amber-400 flex items-center justify-center text-white font-bold text-xs">EC</div>
        <div className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center text-white">🎭</div>
        <div className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center text-white">😂</div>
        <div className="mt-auto text-white/60 text-xs">v1.0</div>
      </aside>

      <main className="flex-1 p-8">
        {!gameStarted ? (
          <div className="max-w-3xl mx-auto mt-20">
            <div className="glass-strong p-8 rounded-xl card-shadow text-center">
              <h1 className="text-white text-4xl font-bold mb-4">Emotion Charades 🎭</h1>
              <p className="text-white/80 text-lg mb-6">A goofy, expressive game where one player acts out emotions silently and others guess. Laughter guaranteed!</p>
              <button onClick={startGame} disabled={loading} className="btn-primary px-6 py-3 text-white rounded-lg font-semibold">{loading ? 'Starting...' : 'Start Game'}</button>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-white text-3xl font-bold">Emotion Charades 🎭</h1>
              <div className="space-x-2">
                <span className="badge">Round {round} / {MAX_ROUNDS}</span>
                <button onClick={newGame} className="btn-secondary px-4 py-2 rounded-lg">New Game</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stage & Guesses */}
              <div className="lg:col-span-2 glass-strong p-6 rounded-xl card-shadow">
                <div className="flex items-center justify-between">
                  <div className="text-white/80">Actor: <span className="text-white font-semibold">{actor}</span></div>
                  <div className="text-white/70">Score — P1: {score['Player 1']} | P2: {score['Player 2']}</div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Secret Prompt Card */}
                  <div className="glass p-4 rounded-lg">
                    <div className="text-white/70 text-sm mb-2">Secret Prompt (for actor only)</div>
                    {!promptVisible ? (
                      <div className="h-40 rounded-lg bg-black/40 flex items-center justify-center text-white/70">
                        <button onClick={()=> setPromptVisible(true)} className="btn-primary px-4 py-2 rounded-lg">Peek Prompt 👀</button>
                      </div>
                    ) : (
                      <div className="h-40 rounded-lg bg-black/30 p-4 text-white text-lg flex items-center justify-center text-center">
                        {secretPrompt}
                      </div>
                    )}
                  </div>

                  {/* Guess Input */}
                  <div className="glass p-4 rounded-lg">
                    <div className="text-white/70 text-sm mb-2">Guesser</div>
                    <div className="text-white text-sm mb-2">{actor === 'Player 1' ? 'Player 2' : 'Player 1'} — enter a guess:</div>
                    <textarea rows={3} value={guessInput} onChange={e=>setGuessInput(e.target.value)} className="w-full p-3 rounded-lg" placeholder="e.g., HOPEFUL, CONFUSION, UNCERTAINTY..." />
                    <button onClick={()=> submitGuess(actor === 'Player 1' ? 'Player 2' : 'Player 1')} className="mt-2 w-full btn-primary px-4 py-2 rounded-lg">Submit Guess</button>
                  </div>
                </div>

                {/* Guess Log */}
                <div className="mt-6">
                  <div className="text-white/80 text-sm mb-2">Guesses</div>
                  <div className="max-h-[30vh] overflow-y-auto glass p-3 rounded-lg" ref={scrollRef}>
                    {guesses.length === 0 && <div className="text-white/60">No guesses yet. Make your best shot! 😄</div>}
                    {guesses.map((g,i)=> (
                      <div key={i} className={`p-2 rounded mb-2 ${g.correct ? 'bg-green-500/20' : 'bg-white/5'}`}>
                        <div className="text-white"><strong>{g.by}:</strong> {g.text} {g.correct && '✅'}</div>
                        {g.hint && !g.correct && <div className="text-white/70 text-xs mt-1">Hint: {g.hint}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button onClick={revealAndRotate} className="btn-secondary px-4 py-2 rounded-lg">Reveal & Next</button>
                  <button onClick={endGame} className="btn-secondary px-4 py-2 rounded-lg">End Game</button>
                </div>

                {message && <div className="mt-4 text-white/90">{message}</div>}
              </div>

              {/* Tips & Emoji Fun */}
              <aside className="glass-strong p-6 rounded-xl card-shadow">
                <h3 className="text-white text-lg font-semibold mb-4">Emoji Pack</h3>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {['😀','😅','🤔','😮','😢','😡','😍','😴','😇','🤗','🤩','🥳','😏','😬','😎'].map((e,i)=>(
                    <div key={i} className="emoji glass p-2 rounded">{e}</div>
                  ))}
                </div>

                <div className="mt-6 p-4 glass rounded">
                  <div className="text-white/70 text-sm mb-2">Host Tip</div>
                  <div className="text-white/90 text-sm">Keep it goofy and high-energy. Celebrate every attempt — big emotions, big laughs!</div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function Home(){
  const [gameStarted, setGameStarted] = useState(false)
  const [history, setHistory] = useState([]) // array of rounds: { dilemma, p1Answer, p2Answer, comparison, followUp }
  const [currentDilemma, setCurrentDilemma] = useState('')
  const [p1Answer, setP1Answer] = useState('')
  const [p2Answer, setP2Answer] = useState('')
  const [p1Submitted, setP1Submitted] = useState(false)
  const [p2Submitted, setP2Submitted] = useState(false)
  const [comparison, setComparison] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [summary, setSummary] = useState({ alignment: 0, insights: '', areas: '' })
  const [roundNumber, setRoundNumber] = useState(0)
  const MAX_ROUNDS = 7

  const scrollRef = useRef(null)

  useEffect(()=>{
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [history, comparison])

  async function startGame(){
    setGameStarted(true)
    setLoading(true)
    try{
      const res = await axios.post('/api/next_dilemma', { round: 1, history: [] })
      setCurrentDilemma(res.data.dilemma || 'Welcome to Values Compass!')
      setRoundNumber(1)
    }catch(e){
      alert('Error starting game: ' + (e.response?.data?.error || e.message))
    }finally{ setLoading(false) }
  }

  function handleP1Submit(){
    if (!p1Answer.trim()) return
    setP1Submitted(true)
  }

  function handleP2Submit(){
    if (!p2Answer.trim()) return
    setP2Submitted(true)
  }

  async function submitAnswers(){
    if (!p1Submitted || !p2Submitted || !p1Answer.trim() || !p2Answer.trim()) return
    setLoading(true)
    try{
      const payload = { dilemma: currentDilemma, p1Answer: p1Answer.trim(), p2Answer: p2Answer.trim(), history, round: roundNumber }
      const res = await axios.post('/api/submit_answers', payload)
      const comp = res.data.comparison || ''
      const fup = res.data.followUp || ''
      
      // add to history
      setHistory([...history, { dilemma: currentDilemma, p1Answer: p1Answer.trim(), p2Answer: p2Answer.trim(), comparison: comp, followUp: fup }])
      setComparison(comp)
      setFollowUp(fup)
      
      // reset inputs
      setP1Answer('')
      setP2Answer('')
      setP1Submitted(false)
      setP2Submitted(false)
    }catch(e){
      alert('Error submitting answers: ' + (e.response?.data?.error || e.message))
    }finally{ setLoading(false) }
  }

  async function nextDilemma(){
    if (roundNumber >= MAX_ROUNDS){
      await endGame()
      return
    }
    setLoading(true)
    setComparison('')
    setFollowUp('')
    try{
      const res = await axios.post('/api/next_dilemma', { round: roundNumber + 1, history })
      setCurrentDilemma(res.data.dilemma || 'Next dilemma...')
      setRoundNumber(roundNumber + 1)
    }catch(e){
      alert('Error getting next dilemma: ' + (e.response?.data?.error || e.message))
    }finally{ setLoading(false) }
  }

  async function endGame(){
    setLoading(true)
    try{
      const res = await axios.post('/api/end_game', { history })
      const align = res.data.alignment || 0
      const insights = res.data.insights || ''
      const areas = res.data.areas || ''
      setSummary({ alignment: align, insights, areas })
      setShowSummary(true)
    }catch(e){
      alert('Error ending game: ' + (e.response?.data?.error || e.message))
    }finally{ setLoading(false) }
  }

  function newGame(){
    setGameStarted(false)
    setHistory([])
    setCurrentDilemma('')
    setP1Answer('')
    setP2Answer('')
    setP1Submitted(false)
    setP2Submitted(false)
    setComparison('')
    setFollowUp('')
    setRoundNumber(0)
    setShowSummary(false)
    setSummary({ alignment: 0, insights: '', areas: '' })
  }

  return (
    <div className="min-h-screen flex">
      <div className="elinity-badge">ELINITY</div>
      {/* Sidebar */}
      <aside className="w-20 p-4 flex flex-col items-center space-y-6 glass-strong card-shadow">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs">VC</div>
        <div className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center text-white">🧭</div>
        <div className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center text-white">💬</div>
        <div className="mt-auto text-white/60 text-xs">v1.0</div>
      </aside>

      <main className="flex-1 p-8">
        {!gameStarted ? (
          <div className="max-w-3xl mx-auto mt-20">
            <div className="glass-strong p-8 rounded-xl card-shadow text-center">
              <h1 className="text-white text-4xl font-bold mb-4">Values Compass 🧭</h1>
              <p className="text-white/80 text-lg mb-6">
                A discovery game around personal values and philosophies. Explore meaningful dilemmas, compare your answers, and visualize your alignment.
              </p>
              <button onClick={startGame} disabled={loading} className="btn-primary px-6 py-3 text-white rounded-lg font-semibold">
                {loading ? 'Starting...' : 'Start Game'}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-white text-3xl font-bold">Values Compass 🧭</h1>
              <div className="space-x-2">
                <button onClick={newGame} className="btn-secondary px-4 py-2 text-white rounded-lg">New Game</button>
                <button onClick={endGame} disabled={loading || roundNumber < 3} className="btn-secondary px-4 py-2 text-white rounded-lg">End & Summarize</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Current Dilemma & History */}
              <div className="lg:col-span-2 glass-strong p-6 rounded-xl card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white text-xl font-semibold">Round {roundNumber} / {MAX_ROUNDS}</h2>
                  <div className="text-white/70 text-sm">{history.length} completed</div>
                </div>

                <div className="glass p-4 rounded-lg mb-6">
                  <div className="text-white/60 text-sm mb-2">Current Dilemma</div>
                  <div className="text-white text-lg font-medium">{currentDilemma}</div>
                </div>

                {/* Side-by-side answer input */}
                {!comparison && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="answer-card-p1 p-4 rounded-lg">
                      <div className="text-white font-semibold mb-2">Player 1</div>
                      <textarea
                        value={p1Answer}
                        onChange={e => setP1Answer(e.target.value)}
                        disabled={p1Submitted}
                        rows={4}
                        className="w-full p-3 rounded-lg bg-black/20 text-white placeholder-white/50"
                        placeholder="Your answer..."
                      />
                      <button
                        onClick={handleP1Submit}
                        disabled={p1Submitted || !p1Answer.trim()}
                        className="mt-2 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium"
                      >
                        {p1Submitted ? 'Submitted ✓' : 'Submit'}
                      </button>
                    </div>

                    <div className="answer-card-p2 p-4 rounded-lg">
                      <div className="text-white font-semibold mb-2">Player 2</div>
                      <textarea
                        value={p2Answer}
                        onChange={e => setP2Answer(e.target.value)}
                        disabled={p2Submitted}
                        rows={4}
                        className="w-full p-3 rounded-lg bg-black/20 text-white placeholder-white/50"
                        placeholder="Your answer..."
                      />
                      <button
                        onClick={handleP2Submit}
                        disabled={p2Submitted || !p2Answer.trim()}
                        className="mt-2 w-full px-4 py-2 bg-teal-600 text-white rounded-lg font-medium"
                      >
                        {p2Submitted ? 'Submitted ✓' : 'Submit'}
                      </button>
                    </div>
                  </div>
                )}

                {p1Submitted && p2Submitted && !comparison && (
                  <div className="mb-6">
                    <button onClick={submitAnswers} disabled={loading} className="btn-primary w-full px-4 py-3 text-white rounded-lg font-semibold">
                      {loading ? 'Analyzing...' : 'Compare Answers'}
                    </button>
                  </div>
                )}

                {/* Comparison & Follow-up */}
                {comparison && (
                  <div className="fade-in mb-6">
                    <div className="glass p-4 rounded-lg mb-4">
                      <div className="text-white/60 text-sm mb-2">AI Comparison</div>
                      <div className="text-white">{comparison}</div>
                    </div>
                    {followUp && (
                      <div className="glass p-4 rounded-lg mb-4">
                        <div className="text-white/60 text-sm mb-2">Follow-up Question</div>
                        <div className="text-white italic">{followUp}</div>
                      </div>
                    )}
                    <button onClick={nextDilemma} disabled={loading} className="btn-primary w-full px-4 py-3 text-white rounded-lg font-semibold">
                      {roundNumber >= MAX_ROUNDS ? 'Finish Game' : 'Next Dilemma →'}
                    </button>
                  </div>
                )}

                {/* History */}
                {history.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-white text-lg font-semibold mb-3">Previous Rounds</h3>
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto" ref={scrollRef}>
                      {history.map((r, i) => (
                        <div key={i} className="glass p-3 rounded-lg fade-in">
                          <div className="text-white/70 text-xs mb-1">Round {i + 1}</div>
                          <div className="text-white/90 text-sm mb-2 font-medium">{r.dilemma}</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-indigo-900/20 p-2 rounded"><strong>P1:</strong> {r.p1Answer}</div>
                            <div className="bg-teal-900/20 p-2 rounded"><strong>P2:</strong> {r.p2Answer}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Alignment Visualization */}
              <aside className="glass-strong p-6 rounded-xl card-shadow">
                <h3 className="text-white text-lg font-semibold mb-4">Alignment</h3>
                <div className="flex flex-col items-center">
                  <div className="progress-circle mb-4" style={{ '--progress': `${summary.alignment}%` }}>
                    <div className="progress-text">{summary.alignment}%</div>
                  </div>
                  <div className="text-white/70 text-sm text-center">
                    Based on {history.length} round{history.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-white/80 text-sm mb-2">Quick Stats</div>
                  <div className="space-y-2 text-xs text-white/70">
                    <div>• Rounds completed: {history.length}</div>
                    <div>• Current round: {roundNumber}</div>
                    <div>• Remaining: {MAX_ROUNDS - roundNumber}</div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-white/5 rounded-lg">
                  <div className="text-white/60 text-xs mb-2">💡 Tip</div>
                  <div className="text-white/80 text-xs">
                    Be honest and reflective. There are no wrong answers — just opportunities to learn about each other.
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative max-w-3xl w-full p-8 glass-strong rounded-xl mx-4">
            <h2 className="text-white text-3xl font-bold mb-4">Your Values Compass 🧭</h2>
            
            <div className="mb-6 flex items-center justify-center">
              <div className="progress-circle" style={{ '--progress': `${summary.alignment}%` }}>
                <div className="progress-text">{summary.alignment}%</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-white/70 text-sm mb-2">Overall Alignment</div>
              <div className="text-white text-lg">{summary.alignment}% values alignment across {history.length} dilemmas</div>
            </div>

            {summary.insights && (
              <div className="mb-6 glass p-4 rounded-lg">
                <div className="text-white/70 text-sm mb-2">Key Insights</div>
                <div className="text-white">{summary.insights}</div>
              </div>
            )}

            {summary.areas && (
              <div className="mb-6 glass p-4 rounded-lg">
                <div className="text-white/70 text-sm mb-2">Areas of Connection</div>
                <div className="text-white">{summary.areas}</div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowSummary(false)} className="btn-secondary px-6 py-2 text-white rounded-lg">Close</button>
              <button onClick={newGame} className="btn-primary px-6 py-2 text-white rounded-lg">New Game</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

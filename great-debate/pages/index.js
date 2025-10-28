import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function Home(){
  const [step, setStep] = useState('welcome') // welcome | setup | debating | results
  const [topic, setTopic] = useState(null)
  const [player1Name, setPlayer1Name] = useState('')
  const [player2Name, setPlayer2Name] = useState('')
  const [player1Side, setPlayer1Side] = useState(null) // 'for' | 'against'
  const [currentTurn, setCurrentTurn] = useState(1) // which player's turn (1 or 2)
  const [debateArgs, setDebateArgs] = useState([]) // [{player, side, text, reactions}]
  const [currentArgument, setCurrentArgument] = useState('')
  const [aiCommentary, setAiCommentary] = useState([])
  const [winner, setWinner] = useState(null)
  const [loading, setLoading] = useState(false)
  const [turnCount, setTurnCount] = useState(0)
  const debateRef = useRef(null)

  const MAX_TURNS = 6 // 3 turns per player

  const generateTopic = async () => {
    setLoading(true)
    try{
      const res = await axios.post('/api/generate_topic')
      setTopic(res.data.topic)
      setStep('setup')
    }catch(err){
      console.error('generate_topic error:', err)
    }finally{
      setLoading(false)
    }
  }

  const startDebate = () => {
    if(!player1Name.trim() || !player2Name.trim() || !player1Side) return
    setStep('debating')
    setCurrentTurn(1)
  }

  const submitArgument = async () => {
    if(!currentArgument.trim()) return

    const playerName = currentTurn === 1 ? player1Name : player2Name
    const side = currentTurn === 1 ? player1Side : (player1Side === 'for' ? 'against' : 'for')
    
    const newArg = {
      player: playerName,
      side,
      text: currentArgument.trim(),
      reactions: {}
    }

    const updatedArgs = [...debateArgs, newArg]
    setDebateArgs(updatedArgs)
    setCurrentArgument('')
    setTurnCount(turnCount + 1)

    // Get AI commentary every 2 arguments
    if((turnCount + 1) % 2 === 0){
      setLoading(true)
      try{
        const res = await axios.post('/api/get_commentary', {
          topic: topic,
          arguments: updatedArgs
        })
        setAiCommentary([...aiCommentary, res.data.commentary])
      }catch(err){
        console.error('get_commentary error:', err)
      }finally{
        setLoading(false)
      }
    }

    // Check if debate is over
    if(turnCount + 1 >= MAX_TURNS){
      declareWinner(updatedArgs)
    } else {
      // Switch turns
      setCurrentTurn(currentTurn === 1 ? 2 : 1)
    }

    // Scroll to bottom
    setTimeout(() => {
      if(debateRef.current){
        debateRef.current.scrollTop = debateRef.current.scrollHeight
      }
    }, 100)
  }

  const declareWinner = async (finalArgs) => {
    setLoading(true)
    try{
      const res = await axios.post('/api/declare_winner', {
        topic: topic,
        arguments: finalArgs,
        player1: {name: player1Name, side: player1Side},
        player2: {name: player2Name, side: player1Side === 'for' ? 'against' : 'for'}
      })
      setWinner(res.data)
      setStep('results')
    }catch(err){
      console.error('declare_winner error:', err)
    }finally{
      setLoading(false)
    }
  }

  const resetGame = () => {
    setStep('welcome')
    setTopic(null)
    setPlayer1Name('')
    setPlayer2Name('')
    setPlayer1Side(null)
    setCurrentTurn(1)
    setDebateArgs([])
    setCurrentArgument('')
    setAiCommentary([])
    setWinner(null)
    setTurnCount(0)
  }

  const addReaction = (argIndex, emoji) => {
    const updated = [...debateArgs]
    if(!updated[argIndex].reactions[emoji]){
      updated[argIndex].reactions[emoji] = 0
    }
    updated[argIndex].reactions[emoji]++
    setDebateArgs(updated)
  }

  const currentPlayer = currentTurn === 1 ? player1Name : player2Name
  const currentSide = currentTurn === 1 ? player1Side : (player1Side === 'for' ? 'against' : 'for')

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="elinity-badge">ELINITY</div>
      <div className="max-w-4xl w-full glass card-shadow rounded-3xl p-8 text-white">
        
        {/* WELCOME */}
        {step === 'welcome' && (
          <div className="text-center">
            <h1 className="text-5xl font-extrabold mb-3">🎭 The Great Debate</h1>
            <p className="text-lg mb-8 text-white/80">Battle of wits on absurd topics. May the best argument win!</p>
            <button 
              onClick={generateTopic} 
              disabled={loading}
              className="px-8 py-4 rounded-xl font-semibold text-xl btn-primary disabled:opacity-50"
            >
              {loading ? 'Generating Topic...' : '⚡ Generate Debate Topic'}
            </button>
          </div>
        )}

        {/* SETUP */}
        {step === 'setup' && topic && (
          <div>
            <h2 className="text-3xl font-bold mb-6 text-center">Debate Topic</h2>
            <div className="topic-card mb-8">
              <div className="text-3xl font-bold mb-2">🔥</div>
              <div className="text-2xl font-semibold">{topic}</div>
            </div>

            <div className="space-y-4 mb-6">
              <input 
                className="w-full px-4 py-3 rounded-xl" 
                placeholder="Player 1 Name" 
                value={player1Name} 
                onChange={e => setPlayer1Name(e.target.value)}
              />
              <input 
                className="w-full px-4 py-3 rounded-xl" 
                placeholder="Player 2 Name" 
                value={player2Name} 
                onChange={e => setPlayer2Name(e.target.value)}
              />

              <div>
                <p className="text-white/80 mb-2">Player 1, choose your side:</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setPlayer1Side('for')}
                    className={`flex-1 py-3 rounded-xl font-semibold ${player1Side === 'for' ? 'btn-for' : 'btn-secondary'}`}
                  >
                    ✅ For
                  </button>
                  <button 
                    onClick={() => setPlayer1Side('against')}
                    className={`flex-1 py-3 rounded-xl font-semibold ${player1Side === 'against' ? 'btn-against' : 'btn-secondary'}`}
                  >
                    ❌ Against
                  </button>
                </div>
              </div>

              {player1Side && (
                <div className="text-center text-white/70">
                  <p><strong>{player2Name || 'Player 2'}</strong> will argue <strong>{player1Side === 'for' ? 'Against' : 'For'}</strong></p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={startDebate} 
                disabled={!player1Name.trim() || !player2Name.trim() || !player1Side}
                className="flex-1 py-3 rounded-xl font-semibold btn-primary disabled:opacity-50"
              >
                🎯 Start Debate
              </button>
              <button 
                onClick={generateTopic}
                disabled={loading}
                className="px-6 py-3 rounded-xl font-semibold btn-secondary disabled:opacity-50"
              >
                🔄 New Topic
              </button>
            </div>
          </div>
        )}

        {/* DEBATING */}
        {step === 'debating' && (
          <div>
            <div className="topic-card mb-6">
              <div className="text-lg font-semibold">{topic}</div>
            </div>

            <div className="mb-4 text-center">
              <div className="turn-indicator">
                🎤 {currentPlayer}'s Turn ({turnCount + 1}/{MAX_TURNS})
              </div>
              <div className="mt-2">
                <span className={currentSide === 'for' ? 'side-for' : 'side-against'}>
                  {currentSide === 'for' ? '✅ For' : '❌ Against'}
                </span>
              </div>
            </div>

            {/* Arguments History */}
            <div ref={debateRef} className="max-h-96 overflow-y-auto mb-6 space-y-3">
              {debateArgs.map((arg, i) => (
                <div key={i}>
                  <div className={arg.side === 'for' ? 'argument-for' : 'argument-against'}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold">{arg.player}</div>
                      <span className={arg.side === 'for' ? 'side-for text-xs' : 'side-against text-xs'}>
                        {arg.side === 'for' ? 'For' : 'Against'}
                      </span>
                    </div>
                    <div className="text-white/90 mb-2">{arg.text}</div>
                    <div className="flex gap-2">
                      {['🔥', '👏', '😂', '🤔', '💯'].map(emoji => (
                        <span 
                          key={emoji}
                          className={`emoji-reaction ${arg.reactions[emoji] ? 'selected' : ''}`}
                          onClick={() => addReaction(i, emoji)}
                        >
                          {emoji} {arg.reactions[emoji] || ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI Commentary after every 2 arguments */}
                  {i % 2 === 1 && aiCommentary[Math.floor(i / 2)] && (
                    <div className="ai-commentary">
                      <div className="font-semibold mb-1">🤖 AI Commentary:</div>
                      <div>{aiCommentary[Math.floor(i / 2)]}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="space-y-3">
              <textarea 
                className="w-full px-4 py-3 rounded-xl" 
                placeholder={`${currentPlayer}, make your argument... (1-3 sentences)`}
                rows={3}
                value={currentArgument} 
                onChange={e => setCurrentArgument(e.target.value)}
                onKeyPress={e => {
                  if(e.key === 'Enter' && !e.shiftKey){
                    e.preventDefault()
                    submitArgument()
                  }
                }}
              />
              <button 
                onClick={submitArgument} 
                disabled={loading || !currentArgument.trim()}
                className="w-full py-3 rounded-xl font-semibold btn-primary disabled:opacity-50"
              >
                {loading ? 'Processing...' : '📣 Submit Argument'}
              </button>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {step === 'results' && winner && (
          <div className="text-center">
            <h2 className="text-4xl font-extrabold mb-6">🏆 Debate Results</h2>
            
            <div className="topic-card mb-8">
              <div className="text-xl font-semibold mb-4">{topic}</div>
              <div className="winner-badge mb-4">
                🎉 Winner: {winner.winner_name} 🎉
              </div>
              <div className={winner.winner_side === 'for' ? 'side-for' : 'side-against'}>
                Argued {winner.winner_side === 'for' ? 'For' : 'Against'}
              </div>
            </div>

            {winner.summary && (
              <div className="ai-commentary mb-6">
                <div className="font-semibold mb-2">📊 Debate Summary:</div>
                <div className="text-left">{winner.summary}</div>
              </div>
            )}

            {winner.reasoning && (
              <div className="glass-strong rounded-2xl p-6 mb-6">
                <div className="font-semibold mb-2 text-lg">💡 Why They Won:</div>
                <div className="text-white/90">{winner.reasoning}</div>
              </div>
            )}

            {winner.next_topic && (
              <div className="glass-strong rounded-2xl p-6 mb-6">
                <div className="font-semibold mb-2">🎲 Try This Next:</div>
                <div className="text-white/80 italic">{winner.next_topic}</div>
              </div>
            )}

            <button 
              onClick={resetGame}
              className="px-8 py-3 rounded-xl font-semibold btn-primary"
            >
              🔄 New Debate
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

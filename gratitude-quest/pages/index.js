import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function Home(){
  const [step, setStep] = useState('intro')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tokens, setTokens] = useState([])
  const endRef = useRef(null)

  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [tokens])

  const addGratitude = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    try{
      const res = await axios.post('/api/transform_token', { gratitude: input.trim() })
      const t = res.data.token || {}
      setTokens(prev => [...prev, {
        name: t.token_name || 'Gratitude Light',
        desc: t.symbol_description || 'A soft light symbolizing your appreciation.',
        emoji: t.emoji || '✨',
      }])
      setInput('')
      if (step !== 'playing') setStep('playing')
    }catch(err){
      console.error('addGratitude error:', err)
      alert('Sorry, I could not transform that. Try again!')
    }finally{
      setLoading(false)
    }
  }

  const endSession = () => setStep('final')
  const resetSession = () => { setTokens([]); setInput(''); setStep('intro') }

  if (step === 'intro') return (
    <div className="aurora">
      <div className="elinity-badge">ELINITY</div>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-10 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🌌</div>
            <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-aurora1 via-aurora2 to-aurora3 bg-clip-text text-transparent">
              Gratitude Quest
            </h1>
            <p className="text-white/80">Collect Tokens of Joy</p>
            <div className="mt-4 inline-block text-sm text-white/80 px-4 py-2 rounded-full badge-soft">Guided by ElinityAI</div>
          </div>

          <div className="space-y-3 text-white/90">
            <p>Welcome to Gratitude Quest. Each story you share becomes a luminous token.</p>
            <p>Each round, share something you’re grateful for — big or small.</p>
            <p>ElinityAI will transform it into a symbolic token saved in your Vault.</p>
          </div>

          <button onClick={()=>setStep('playing')} className="mt-8 w-full py-4 rounded-xl font-bold text-lg bg-white text-black">
            Begin
          </button>
        </div>
      </div>
    </div>
  )

  if (step === 'playing') return (
    <div className="aurora">
      <div className="elinity-badge">ELINITY</div>
      <div className="min-h-screen p-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-aurora1 via-aurora2 to-aurora3 bg-clip-text text-transparent">🌌 Gratitude Quest</h2>
          <p className="text-sm text-white/70">What are you grateful for today?</p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="card rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-3">Prompt</h3>
            <p className="text-white/80 mb-4">Share one thing you’re grateful for. ElinityAI will transform it into a symbolic token.</p>

            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e)=>setInput(e.target.value)}
                onKeyDown={(e)=> e.key==='Enter' && addGratitude()}
                placeholder="e.g., Coffee with my friend"
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/50 focus:outline-none focus:border-white/30"
              />
              <button onClick={addGratitude} disabled={loading || !input.trim()} className="px-6 rounded-xl font-semibold bg-white text-black disabled:opacity-60">
                {loading? 'Creating…' : 'Create Token'}
              </button>
            </div>

            {tokens.length>0 && (
              <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs text-white/60 mb-1">Latest Token</div>
                <div className="text-white/90">
                  <span className="mr-2">{tokens[tokens.length-1].emoji}</span>
                  <span className="font-semibold">{tokens[tokens.length-1].name}</span>
                  <span className="ml-2 text-white/70">— {tokens[tokens.length-1].desc}</span>
                </div>
              </div>
            )}
          </div>

          <div className="card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold">Gratitude Vault</h3>
              <div className="text-sm text-white/60">{tokens.length} token{tokens.length!==1?'s':''}</div>
            </div>
            {tokens.length===0 ? (
              <p className="text-white/70">Tokens you create will appear here as a living artwork of appreciation.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tokens.map((t, i)=> (
                  <div key={i} className="token p-4">
                    <div className="text-2xl mb-1">{t.emoji}</div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-sm text-white/70">{t.desc}</div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            )}
            <div className="mt-5 flex gap-3">
              <button onClick={endSession} className="flex-1 py-3 rounded-xl font-semibold badge-soft">End Session</button>
              <button onClick={()=>setStep('intro')} className="px-4 rounded-xl text-sm" style={{ color:'#a7f3d0' }}>Help</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (step === 'final') return (
    <div className="aurora">
      <div className="elinity-badge">ELINITY</div>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🌟</div>
            <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-aurora1 via-aurora2 to-aurora3 bg-clip-text text-transparent">Your Vault of Gratitude</h2>
            <p className="text-white/70">A living shrine of appreciation built by your words.</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {tokens.map((t,i)=> (
              <div key={i} className="token p-4">
                <div className="text-3xl mb-2">{t.emoji}</div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-white/70">{t.desc}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={resetSession} className="flex-1 py-4 rounded-xl font-bold bg-white text-black">Start New Session</button>
            <button onClick={()=>setStep('playing')} className="flex-1 py-4 rounded-xl font-semibold badge-soft">Add More</button>
          </div>
        </div>
      </div>
    </div>
  )
}

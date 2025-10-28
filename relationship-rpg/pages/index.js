import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Home(){
  const [step, setStep] = useState('setup') // setup | board | view_quest | view_artifact
  const [partyName, setPartyName] = useState('')
  const [player1Name, setPlayer1Name] = useState('')
  const [player2Name, setPlayer2Name] = useState('')
  const [state, setState] = useState(null)
  const [selectedQuest, setSelectedQuest] = useState(null)
  const [selectedArtifact, setSelectedArtifact] = useState(null)
  const [customQuestTitle, setCustomQuestTitle] = useState('')
  const [customQuestDesc, setCustomQuestDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [sessionData, setSessionData] = useState('')
  const [loadData, setLoadData] = useState('')
  const [showLoadModal, setShowLoadModal] = useState(false)

  const xpToNextLevel = state ? 100 - (state.xp_total % 100) : 100
  const xpProgress = state ? (state.xp_total % 100) : 0

  const startParty = async () => {
    if(!partyName.trim() || !player1Name.trim() || !player2Name.trim()) return
    setLoading(true)
    try{
      const res = await axios.post('/api/start_party', {
        party_name: partyName.trim(),
        players: [
          {name: player1Name.trim(), role: ''},
          {name: player2Name.trim(), role: ''}
        ]
      })
      setState(res.data)
      setStep('board')
    }catch(err){
      console.error('start_party error:', err)
    }finally{
      setLoading(false)
    }
  }

  const addQuest = async (type) => {
    setLoading(true)
    try{
      const payload = { state, quest_type: type }
      if(type === 'custom'){
        if(!customQuestTitle.trim()) return
        payload.custom_title = customQuestTitle.trim()
        payload.custom_description = customQuestDesc.trim()
      }
      const res = await axios.post('/api/add_quest', payload)
      setState(res.data)
      setCustomQuestTitle('')
      setCustomQuestDesc('')
    }catch(err){
      console.error('add_quest error:', err)
    }finally{
      setLoading(false)
    }
  }

  const completeQuest = async (questId) => {
    setLoading(true)
    try{
      const res = await axios.post('/api/complete_quest', { state, quest_id: questId })
      setState(res.data)
      setSelectedQuest(null)
    }catch(err){
      console.error('complete_quest error:', err)
    }finally{
      setLoading(false)
    }
  }

  const saveSession = async () => {
    try{
      const res = await axios.post('/api/save_session', {state})
      setSessionData(JSON.stringify(res.data, null, 2))
      setShowSaveModal(true)
    }catch(err){
      console.error('save_session error:', err)
    }
  }

  const loadSession = () => {
    try{
      const parsed = JSON.parse(loadData)
      setState(parsed)
      setStep('board')
      setShowLoadModal(false)
      setLoadData('')
    }catch(err){
      alert('Invalid JSON')
    }
  }

  const activeQuests = state ? state.quests.filter(q => q.status === 'active') : []
  const completedQuests = state ? state.quests.filter(q => q.status === 'completed') : []

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="elinity-badge">ELINITY</div>
      <div className="max-w-5xl w-full glass card-shadow rounded-3xl p-8 text-white">
        
        {/* SETUP */}
        {step === 'setup' && (
          <div className="text-center">
            <h1 className="text-5xl font-extrabold mb-3">💕 Relationship RPG</h1>
            <p className="text-lg mb-8 text-white/80">Embark on a shared journey of growth, quests, and milestones</p>
            
            <div className="max-w-md mx-auto space-y-4">
              <input 
                className="w-full px-4 py-3 rounded-xl border border-white/10" 
                placeholder="Party Name (e.g., The Dream Team)" 
                value={partyName} 
                onChange={e => setPartyName(e.target.value)}
              />
              <input 
                className="w-full px-4 py-3 rounded-xl border border-white/10" 
                placeholder="Player 1 Name" 
                value={player1Name} 
                onChange={e => setPlayer1Name(e.target.value)}
              />
              <input 
                className="w-full px-4 py-3 rounded-xl border border-white/10" 
                placeholder="Player 2 Name" 
                value={player2Name} 
                onChange={e => setPlayer2Name(e.target.value)}
              />
              <button 
                onClick={startParty} 
                disabled={loading || !partyName.trim() || !player1Name.trim() || !player2Name.trim()}
                className="w-full py-3 rounded-xl font-semibold btn-primary disabled:opacity-50"
              >
                {loading ? 'Starting...' : 'Begin Journey'}
              </button>
              <button 
                onClick={() => setShowLoadModal(true)} 
                className="w-full py-3 rounded-xl font-semibold btn-secondary"
              >
                Load Session
              </button>
            </div>
          </div>
        )}

        {/* QUEST BOARD */}
        {step === 'board' && state && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold">{state.party_name}</h1>
                <p className="text-white/70">{state.players.map(p => p.name).join(' & ')}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-pink-300">Level {state.level}</div>
                <div className="text-sm text-white/70">{xpProgress} / 100 XP</div>
              </div>
            </div>

            {/* XP Bar */}
            <div className="xp-bar mb-8">
              <div className="xp-fill" style={{width: `${xpProgress}%`}}></div>
            </div>

            {/* Artifacts */}
            {state.artifacts.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-3">🏆 Artifacts</h3>
                <div className="flex gap-3 flex-wrap">
                  {state.artifacts.map((art, i) => (
                    <div 
                      key={i} 
                      onClick={() => {setSelectedArtifact(art); setStep('view_artifact')}}
                      className="artifact-badge cursor-pointer"
                    >
                      {art.emoji}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Quests */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-3">⚔️ Active Quests</h3>
              {activeQuests.length === 0 && <p className="text-white/60">No active quests. Add one below!</p>}
              <div className="space-y-3">
                {activeQuests.map(q => (
                  <div 
                    key={q.id} 
                    onClick={() => {setSelectedQuest(q); setStep('view_quest')}}
                    className="quest-active cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-lg">{q.title}</div>
                        <div className="text-white/70 text-sm mt-1">{q.description}</div>
                      </div>
                      <div className="text-pink-300 font-bold text-sm">+{q.xp_reward} XP</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Quest */}
            <div className="glass-strong rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">➕ Add Quest</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button onClick={() => addQuest('gratitude')} disabled={loading} className="py-3 rounded-xl font-semibold btn-secondary disabled:opacity-50">
                  🙏 Gratitude Ritual
                </button>
                <button onClick={() => addQuest('adventure')} disabled={loading} className="py-3 rounded-xl font-semibold btn-secondary disabled:opacity-50">
                  🗺️ Adventure Plan
                </button>
                <button onClick={() => addQuest('conflict')} disabled={loading} className="py-3 rounded-xl font-semibold btn-secondary disabled:opacity-50">
                  🕊️ Conflict Resolution
                </button>
                <button onClick={() => addQuest('kindness')} disabled={loading} className="py-3 rounded-xl font-semibold btn-secondary disabled:opacity-50">
                  💖 Act of Kindness
                </button>
              </div>
              <div className="space-y-2">
                <input 
                  className="w-full px-4 py-2 rounded-xl border border-white/10" 
                  placeholder="Custom Quest Title" 
                  value={customQuestTitle} 
                  onChange={e => setCustomQuestTitle(e.target.value)}
                />
                <textarea 
                  className="w-full px-4 py-2 rounded-xl border border-white/10" 
                  placeholder="Custom Quest Description (optional)" 
                  rows={2}
                  value={customQuestDesc} 
                  onChange={e => setCustomQuestDesc(e.target.value)}
                />
                <button onClick={() => addQuest('custom')} disabled={loading || !customQuestTitle.trim()} className="w-full py-3 rounded-xl font-semibold btn-primary disabled:opacity-50">
                  Create Custom Quest
                </button>
              </div>
            </div>

            {/* Completed Quests */}
            {completedQuests.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-3">✅ Completed Quests</h3>
                <div className="space-y-2">
                  {completedQuests.map(q => (
                    <div key={q.id} className="quest-completed">
                      <div className="font-semibold">{q.title}</div>
                      <div className="text-white/60 text-sm">{new Date(q.completed_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Session */}
            <div className="text-center">
              <button onClick={saveSession} className="px-6 py-3 rounded-xl font-semibold btn-secondary">
                💾 Save Session
              </button>
            </div>
          </div>
        )}

        {/* VIEW QUEST */}
        {step === 'view_quest' && selectedQuest && (
          <div>
            <button onClick={() => setStep('board')} className="mb-4 text-white/70 hover:text-white">← Back to Board</button>
            <h2 className="text-3xl font-bold mb-2">{selectedQuest.title}</h2>
            <p className="text-white/80 mb-6">{selectedQuest.description}</p>
            <div className="flex gap-4">
              <button onClick={() => completeQuest(selectedQuest.id)} disabled={loading} className="px-6 py-3 rounded-xl font-semibold btn-primary disabled:opacity-50">
                {loading ? 'Completing...' : `✅ Mark Complete (+${selectedQuest.xp_reward} XP)`}
              </button>
              <button onClick={() => setStep('board')} className="px-6 py-3 rounded-xl font-semibold btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* VIEW ARTIFACT */}
        {step === 'view_artifact' && selectedArtifact && (
          <div className="text-center">
            <button onClick={() => setStep('board')} className="mb-4 text-white/70 hover:text-white">← Back to Board</button>
            <div className="artifact-badge mx-auto mb-4" style={{width: 120, height: 120, fontSize: '4rem'}}>
              {selectedArtifact.emoji}
            </div>
            <h2 className="text-3xl font-bold mb-2">{selectedArtifact.title}</h2>
            <p className="text-white/80 mb-2">{selectedArtifact.description}</p>
            <p className="text-white/60 text-sm">Unlocked at Level {selectedArtifact.unlocked_at_level}</p>
          </div>
        )}

      </div>

      {/* SAVE MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="glass-strong rounded-2xl p-6 max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-3 text-white">💾 Session Saved</h3>
            <p className="text-white/70 mb-4">Copy this JSON to restore your session later:</p>
            <textarea 
              className="w-full px-4 py-3 rounded-xl border border-white/10 font-mono text-sm" 
              rows={10} 
              value={sessionData} 
              readOnly
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => {navigator.clipboard.writeText(sessionData); alert('Copied!')}} className="flex-1 py-3 rounded-xl font-semibold btn-primary">
                📋 Copy to Clipboard
              </button>
              <button onClick={() => setShowSaveModal(false)} className="flex-1 py-3 rounded-xl font-semibold btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOAD MODAL */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="glass-strong rounded-2xl p-6 max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-3 text-white">📂 Load Session</h3>
            <p className="text-white/70 mb-4">Paste your saved session JSON:</p>
            <textarea 
              className="w-full px-4 py-3 rounded-xl border border-white/10 font-mono text-sm" 
              rows={10} 
              value={loadData} 
              onChange={e => setLoadData(e.target.value)}
              placeholder='{"party_name": "...", ...}'
            />
            <div className="flex gap-3 mt-4">
              <button onClick={loadSession} className="flex-1 py-3 rounded-xl font-semibold btn-primary">
                Load
              </button>
              <button onClick={() => setShowLoadModal(false)} className="flex-1 py-3 rounded-xl font-semibold btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

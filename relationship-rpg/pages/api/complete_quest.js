import fs from 'fs'
import path from 'path'
import axios from 'axios'

function getModelCandidates(){
  return process.env.GROQ_MODEL 
    ? [process.env.GROQ_MODEL, 'groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
    : ['groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
}

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'POST only'})
  
  const {state, quest_id} = req.body
  if(!state || !quest_id) return res.status(400).json({error:'state and quest_id required'})

  const quest = state.quests.find(q => q.id === quest_id)
  if(!quest) return res.status(404).json({error:'Quest not found'})

  const systemPrompt = fs.readFileSync(path.join(process.cwd(), 'public', 'system_prompt.txt'), 'utf8')
  
  // Mark quest complete
  quest.status = 'completed'
  quest.completed_at = new Date().toISOString()

  // Award XP
  const newXP = state.xp_total + quest.xp_reward
  const newLevel = Math.floor(newXP / 100) + 1
  const leveledUp = newLevel > state.level

  let newArtifact = null
  if(leveledUp){
    // Generate artifact
    const apiKey = process.env.GROQ_API_KEY
    if(!apiKey){
      newArtifact = {
        emoji: '🌟',
        title: `Level ${newLevel} Badge`,
        description: `Unlocked at level ${newLevel}`,
        unlocked_at_level: newLevel
      }
    } else {
      const models = getModelCandidates()
      const prompt = `Party "${state.party_name}" just reached level ${newLevel}. Generate a celebratory artifact. Return ONLY a JSON object with: emoji (single emoji), title (string), description (string, 1 sentence). No extra text.`

      for(const model of models){
        try{
          const apiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model,
            messages: [
              {role: 'system', content: systemPrompt},
              {role: 'user', content: prompt}
            ],
            temperature: 0.9,
            max_tokens: 200
          }, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 20000
          })
          const text = apiRes.data.choices[0].message.content.trim()
          const match = text.match(/\{[\s\S]*\}/)
          if(match){
            const parsed = JSON.parse(match[0])
            newArtifact = {
              emoji: parsed.emoji || '🏆',
              title: parsed.title || `Level ${newLevel} Badge`,
              description: parsed.description || `Reached level ${newLevel}`,
              unlocked_at_level: newLevel
            }
          }
          break
        }catch(err){
          console.error(`Model ${model} failed:`, err.response?.data || err.message)
        }
      }
      if(!newArtifact){
        newArtifact = {
          emoji: '🏆',
          title: `Level ${newLevel} Badge`,
          description: `Reached level ${newLevel}`,
          unlocked_at_level: newLevel
        }
      }
    }
  }

  const updatedState = {
    ...state,
    quests: state.quests.map(q => q.id === quest_id ? quest : q),
    xp_total: newXP,
    level: newLevel,
    artifacts: newArtifact ? [...state.artifacts, newArtifact] : state.artifacts,
    history: [
      ...state.history,
      {timestamp: new Date().toISOString(), event: `quest_completed: ${quest.title} (+${quest.xp_reward} XP)`},
      ...(leveledUp ? [{timestamp: new Date().toISOString(), event: `level_up: reached level ${newLevel}`}] : [])
    ]
  }

  return res.json(updatedState)
}

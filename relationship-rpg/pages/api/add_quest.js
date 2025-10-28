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
  
  const {state, quest_type, custom_title, custom_description} = req.body
  if(!state || !quest_type) return res.status(400).json({error:'state and quest_type required'})

  const systemPrompt = fs.readFileSync(path.join(process.cwd(), 'public', 'system_prompt.txt'), 'utf8')
  
  let newQuest = {
    id: state.quests.length + 1,
    title: '',
    description: '',
    type: quest_type,
    xp_reward: 30,
    status: 'active',
    completed_at: null
  }

  if(quest_type === 'custom'){
    newQuest.title = custom_title || 'Custom Quest'
    newQuest.description = custom_description || 'A custom challenge for the party.'
    newQuest.xp_reward = 40
  } else {
    // Generate quest via AI
    const apiKey = process.env.GROQ_API_KEY
    if(!apiKey){
      // Mock mode
      newQuest.title = `${quest_type.charAt(0).toUpperCase() + quest_type.slice(1)} Quest`
      newQuest.description = `A meaningful ${quest_type} quest for ${state.party_name}.`
    } else {
      const models = getModelCandidates()
      const prompt = `Generate a ${quest_type} quest for party "${state.party_name}". Return ONLY a JSON object with fields: title (string), description (string, 1-2 sentences), xp_reward (number 20-50). No extra text.`

      for(const model of models){
        try{
          const apiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model,
            messages: [
              {role: 'system', content: systemPrompt},
              {role: 'user', content: prompt}
            ],
            temperature: 0.9,
            max_tokens: 300
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
            newQuest.title = parsed.title || newQuest.title
            newQuest.description = parsed.description || newQuest.description
            newQuest.xp_reward = parsed.xp_reward || newQuest.xp_reward
          }
          break
        }catch(err){
          console.error(`Model ${model} failed:`, err.response?.data || err.message)
        }
      }
    }
  }

  const updatedState = {
    ...state,
    quests: [...state.quests, newQuest],
    history: [
      ...state.history,
      {timestamp: new Date().toISOString(), event: `quest_added: ${newQuest.title}`}
    ]
  }

  return res.json(updatedState)
}

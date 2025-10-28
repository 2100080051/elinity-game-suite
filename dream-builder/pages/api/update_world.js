import fs from 'fs'
import path from 'path'
import axios from 'axios'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_FALLBACK_MODELS = ['groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']

function getModelCandidates(){
  const envModel = process.env.GROQ_MODEL
  const list = []
  if (envModel) list.push(envModel)
  for (const m of DEFAULT_FALLBACK_MODELS) if (!list.includes(m)) list.push(m)
  return list
}

function loadSystemPrompt(){
  try{
    const p = path.join(process.cwd(), 'public', 'system_prompt.txt')
    return fs.readFileSync(p, 'utf-8')
  }catch(e){
    return 'You are The Architect in Dream Builder.'
  }
}

function mockUpdate(worldState, message){
  const lower = message.toLowerCase()
  let reply = 'Interesting choice! '
  const newState = { ...worldState }

  // Simple heuristics
  if (!newState.theme){
    if (lower.includes('island')) newState.theme = 'island'
    else if (lower.includes('city')) newState.theme = 'city'
    else if (lower.includes('utopia')) newState.theme = 'utopia'
    else newState.theme = message.split(' ').slice(0,3).join(' ')
    reply += `Let's build a ${newState.theme}! What kind of climate should it have? (tropical, temperate, arid, frozen, etc.)`
  } else if (!newState.parameters.climate){
    newState.parameters.climate = message
    newState.history.push(`Set climate: ${message}`)
    reply += `A ${message} climate — vivid! Now, what about the culture? How do people live and what do they value?`
  } else if (!newState.parameters.culture){
    newState.parameters.culture = message
    newState.history.push(`Defined culture: ${message}`)
    reply += `Beautiful. What aesthetic style should your world have? (futuristic, rustic, minimalist, ornate, etc.)`
  } else {
    newState.parameters.aesthetics = message
    newState.history.push(`Set aesthetics: ${message}`)
    reply += `Wonderful! Your world is taking shape. You can continue refining or save your session.`
  }

  return { reply, state: newState }
}

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { worldState, message } = req.body
  if (!message) return res.status(400).json({ error: 'message required' })

  const systemPrompt = loadSystemPrompt()
  const GROQ_API_KEY = process.env.GROQ_API_KEY

  if (!GROQ_API_KEY){
    const { reply, state } = mockUpdate(worldState || {}, message)
    return res.status(200).json({ reply, state })
  }

  // Build context
  let context = `Current world state:\n${JSON.stringify(worldState, null, 2)}\n\nPlayer says: "${message}"\n\n`
  context += 'As The Architect, respond to the player\'s input. Update the world state accordingly and guide them to the next parameter if needed. Keep your reply conversational and inspiring (2-4 sentences).'

  const models = getModelCandidates()
  for (const model of models){
    try{
      const payload = { model, messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: context } ], max_tokens: 300, temperature: 0.85 }
      const resp = await axios.post(GROQ_URL, payload, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` }, timeout: 30000 })
      const content = resp.data?.choices?.[0]?.message?.content || ''
      
      // Parse reply and attempt to extract updated state (simple approach: just infer from message)
      const newState = { ...worldState }
      const lower = message.toLowerCase()
      
      // Detect theme
      if (!newState.theme){
        if (lower.includes('island')) newState.theme = 'island'
        else if (lower.includes('city')) newState.theme = 'city'
        else if (lower.includes('utopia')) newState.theme = 'utopia'
        else newState.theme = message.split(' ').slice(0,3).join(' ')
        newState.history = newState.history || []
        newState.history.push(`Theme chosen: ${newState.theme}`)
      } else if (!newState.parameters.climate && (lower.includes('climate') || lower.includes('tropical') || lower.includes('temperate') || lower.includes('arid'))){
        newState.parameters.climate = message
        newState.history.push(`Climate: ${message}`)
      } else if (!newState.parameters.culture && lower.includes('cultur')){
        newState.parameters.culture = message
        newState.history.push(`Culture: ${message}`)
      } else if (!newState.parameters.aesthetics){
        newState.parameters.aesthetics = message
        newState.history.push(`Aesthetics: ${message}`)
      }

      return res.status(200).json({ reply: content.trim(), state: newState })
    }catch(e){
      console.error(`Groq error for model=${model}`, e?.response?.data || e.message)
      const code = e?.response?.data?.code || e?.response?.data?.error?.code
      if (code === 'model_not_found') continue
      break
    }
  }

  const { reply, state } = mockUpdate(worldState || {}, message)
  return res.status(200).json({ reply, state })
}

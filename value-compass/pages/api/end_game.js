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
    return 'You are the Game Master for Values Compass.'
  }
}

function mockSummary(history){
  const total = history.length
  if (total === 0) return { alignment: 0, insights: 'No rounds completed.', areas: '' }
  
  // simple mock: random alignment
  const alignment = Math.floor(60 + Math.random() * 30)
  const insights = `You completed ${total} dilemmas together. Your answers show a healthy mix of alignment and diversity, which is great for mutual growth.`
  const areas = 'Both of you value honesty and compassion. You differ slightly on risk tolerance and adventure.'
  return { alignment, insights, areas }
}

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { history } = req.body

  const systemPrompt = loadSystemPrompt()
  const GROQ_API_KEY = process.env.GROQ_API_KEY

  if (!GROQ_API_KEY || !Array.isArray(history) || history.length === 0){
    const { alignment, insights, areas } = mockSummary(history || [])
    return res.status(200).json({ alignment, insights, areas })
  }

  // Build full game context
  let context = 'Full game history:\n'
  for (const r of history){
    context += `\nDilemma: ${r.dilemma}\nPlayer 1: ${r.p1Answer}\nPlayer 2: ${r.p2Answer}\nAI Comparison: ${r.comparison}\n`
  }

  const userPrompt = `${context}\n\nPlease provide a final summary:\n1. Calculate an overall alignment percentage (0-100%) based on how similar their values are across all dilemmas.\n2. Share key insights about their relationship, collaboration, or friendship based on their answers.\n3. Highlight specific areas of connection where they strongly align.\n\nFormat:\nAlignment: <percentage>\nInsights: <your insights>\nAreas: <areas of connection>`

  const models = getModelCandidates()
  for (const model of models){
    try{
      const payload = {
        model,
        messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt } ],
        max_tokens: 600,
        temperature: 0.75,
      }
      const resp = await axios.post(GROQ_URL, payload, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` }, timeout: 60000 })
      const content = resp.data?.choices?.[0]?.message?.content || ''
      
      // Parse alignment, insights, areas
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
      let alignment = 0
      let insights = ''
      let areas = ''
      for (const line of lines){
        if (line.toLowerCase().startsWith('alignment:')){
          const match = line.match(/\d+/)
          if (match) alignment = parseInt(match[0], 10)
        } else if (line.toLowerCase().startsWith('insights:')){
          insights = line.split(':').slice(1).join(':').trim()
        } else if (line.toLowerCase().startsWith('areas:')){
          areas = line.split(':').slice(1).join(':').trim()
        }
      }
      if (!insights) insights = content.split('\n').slice(1, 4).join(' ').trim()
      if (!areas) areas = 'You share common ground on several key values.'

      return res.status(200).json({ alignment, insights, areas })
    }catch(e){
      console.error(`Groq error for model=${model}`, e?.response?.data || e.message)
      const code = e?.response?.data?.code || e?.response?.data?.error?.code
      if (code === 'model_not_found') continue
      break
    }
  }

  // fallback
  const { alignment, insights, areas } = mockSummary(history)
  return res.status(200).json({ alignment, insights, areas })
}

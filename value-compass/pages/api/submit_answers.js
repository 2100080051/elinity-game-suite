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

function mockComparison(dilemma, p1, p2){
  const similar = p1.toLowerCase().includes(p2.toLowerCase().split(' ')[0]) || p2.toLowerCase().includes(p1.toLowerCase().split(' ')[0])
  const comparison = similar
    ? `Both of you seem to value similar priorities here. This alignment shows a shared perspective on ${dilemma.split(' ').slice(0, 5).join(' ')}.`
    : `Interesting difference! Player 1 leans toward one value, while Player 2 prioritizes another. This diversity can enrich your understanding of each other.`
  const followUp = 'What personal experience shaped your answer?'
  return { comparison, followUp }
}

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { dilemma, p1Answer, p2Answer, history, round } = req.body

  if (!dilemma || !p1Answer || !p2Answer) return res.status(400).json({ error: 'dilemma, p1Answer, p2Answer required' })

  const systemPrompt = loadSystemPrompt()
  const GROQ_API_KEY = process.env.GROQ_API_KEY

  if (!GROQ_API_KEY){
    const { comparison, followUp } = mockComparison(dilemma, p1Answer, p2Answer)
    return res.status(200).json({ comparison, followUp })
  }

  // Build context
  let context = `Round ${round}\nDilemma: ${dilemma}\nPlayer 1 answered: "${p1Answer}"\nPlayer 2 answered: "${p2Answer}"\n\n`
  if (Array.isArray(history) && history.length > 0){
    context += 'Previous rounds for context:\n'
    for (const r of history){
      context += `- ${r.dilemma}: P1 said "${r.p1Answer}", P2 said "${r.p2Answer}"\n`
    }
  }

  const userPrompt = `${context}\n\nPlease:\n1. Compare the two answers and highlight where they align or differ.\n2. Offer a gentle insight about what these values might mean.\n3. Ask a thoughtful follow-up question to spark deeper discussion.\n\nFormat:\nComparison: <your comparison>\nFollow-up: <your question>`

  const models = getModelCandidates()
  for (const model of models){
    try{
      const payload = {
        model,
        messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt } ],
        max_tokens: 400,
        temperature: 0.8,
      }
      const resp = await axios.post(GROQ_URL, payload, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` }, timeout: 30000 })
      const content = resp.data?.choices?.[0]?.message?.content || ''
      
      // Parse comparison and follow-up
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
      let comparison = ''
      let followUp = ''
      for (const line of lines){
        if (line.toLowerCase().startsWith('comparison:')){
          comparison = line.split(':').slice(1).join(':').trim()
        } else if (line.toLowerCase().startsWith('follow-up:')){
          followUp = line.split(':').slice(1).join(':').trim()
        }
      }
      if (!comparison) comparison = content.split('\n').slice(0, 3).join(' ').trim()
      if (!followUp) followUp = 'What made you choose that answer?'

      return res.status(200).json({ comparison, followUp })
    }catch(e){
      console.error(`Groq error for model=${model}`, e?.response?.data || e.message)
      const code = e?.response?.data?.code || e?.response?.data?.error?.code
      if (code === 'model_not_found') continue
      break
    }
  }

  // fallback
  const { comparison, followUp } = mockComparison(dilemma, p1Answer, p2Answer)
  return res.status(200).json({ comparison, followUp })
}

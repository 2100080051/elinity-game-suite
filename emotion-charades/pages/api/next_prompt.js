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
    return 'You are the Game Master for Emotion Charades.'
  }
}

function mockPrompt(){
  const list = [
    'Act out HOPEFUL',
    'Show CONFUSION without words',
    "Express the feeling of 'UNCERTAINTY' using only gestures",
    'Act like you are PROUD but trying to hide it',
    'Act out RELIEF after a long wait',
    'Show FRUSTRATION using only body language',
    'Act out NERVOUS EXCITEMENT'
  ]
  return list[Math.floor(Math.random()*list.length)]
}

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { round, actor } = req.body

  const systemPrompt = loadSystemPrompt()
  const GROQ_API_KEY = process.env.GROQ_API_KEY

  if (!GROQ_API_KEY){
    return res.status(200).json({ prompt: mockPrompt() })
  }

  const userPrompt = `We are on round ${round}. Provide ONE playful emotional charade prompt for the actor (${actor}). Keep it short and expressive. Examples: Act out HOPEFUL; Show CONFUSION without words; Express 'uncertainty' using only gestures.`

  const models = getModelCandidates()
  for (const model of models){
    try{
      const payload = { model, messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt } ], max_tokens: 60, temperature: 0.95 }
      const resp = await axios.post(GROQ_URL, payload, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` }, timeout: 20000 })
      const content = resp.data?.choices?.[0]?.message?.content || ''
      const firstLine = content.trim().split('\n')[0].trim()
      return res.status(200).json({ prompt: firstLine.replace(/^[\"']|[\"']$/g, '') })
    }catch(e){
      console.error(`Groq error for model=${model}`, e?.response?.data || e.message)
      const code = e?.response?.data?.code || e?.response?.data?.error?.code
      if (code === 'model_not_found') continue
      break
    }
  }
  return res.status(200).json({ prompt: mockPrompt() })
}

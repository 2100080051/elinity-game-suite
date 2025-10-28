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

const MOCK_GREETING = "Hello, dreamer! 🌙 Welcome to Dream Builder. Together we'll create a unique dream world — an island, a city, a utopia, or something entirely new.\n\nFirst, tell me: what type of world shall we begin with — an island, a city, a utopia, or something else?\nAnd would you like me to create visual illustrations along with text (yes/no)?"

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const initialState = {
    world_name: '',
    theme: '',
    parameters: {
      climate: '',
      culture: '',
      aesthetics: '',
      values: '',
      technology: '',
      notable_landmarks: []
    },
    history: [],
    session_count: 1,
    open_questions: ['theme', 'climate', 'culture', 'aesthetics', 'values', 'technology']
  }

  const systemPrompt = loadSystemPrompt()
  const GROQ_API_KEY = process.env.GROQ_API_KEY

  if (!GROQ_API_KEY){
    return res.status(200).json({ message: MOCK_GREETING, state: initialState })
  }

  const userPrompt = 'Begin the Dream Builder game. Greet the player warmly and ask what type of world they want to build (island, city, utopia, other). Keep it short and inspiring.'

  const models = getModelCandidates()
  for (const model of models){
    try{
      const payload = { model, messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt } ], max_tokens: 200, temperature: 0.85 }
      const resp = await axios.post(GROQ_URL, payload, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` }, timeout: 20000 })
      const content = resp.data?.choices?.[0]?.message?.content || MOCK_GREETING
      return res.status(200).json({ message: content.trim(), state: initialState })
    }catch(e){
      console.error(`Groq error for model=${model}`, e?.response?.data || e.message)
      const code = e?.response?.data?.code || e?.response?.data?.error?.code
      if (code === 'model_not_found') continue
      break
    }
  }

  return res.status(200).json({ message: MOCK_GREETING, state: initialState })
}

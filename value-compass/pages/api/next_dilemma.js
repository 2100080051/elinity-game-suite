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

function mockDilemma(round){
  const dilemmas = [
    'Would you rather have unlimited time or unlimited money?',
    'What matters more: being respected or being loved?',
    'Would you prioritize personal freedom or collective security?',
    'Which is more important: honesty or kindness?',
    'Would you rather be known for your intelligence or your compassion?',
    'What drives you more: curiosity or stability?',
    'Would you choose a life of adventure with uncertainty or comfort with routine?'
  ]
  return dilemmas[Math.min(round - 1, dilemmas.length - 1)]
}

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { round, history } = req.body

  const systemPrompt = loadSystemPrompt()
  const GROQ_API_KEY = process.env.GROQ_API_KEY

  if (!GROQ_API_KEY){
    return res.status(200).json({ dilemma: mockDilemma(round || 1) })
  }

  // Build context from history
  let context = 'Previous rounds:\n'
  if (Array.isArray(history) && history.length > 0){
    for (const r of history){
      context += `- Dilemma: ${r.dilemma}\n  P1: ${r.p1Answer}\n  P2: ${r.p2Answer}\n`
    }
  } else {
    context = 'This is the first round.'
  }

  const userPrompt = `${context}\n\nPlease pose a new meaningful dilemma for round ${round}. Use a "Would you rather..." or "What matters more..." format. Keep it concise and thought-provoking.`

  const models = getModelCandidates()
  for (const model of models){
    try{
      const payload = {
        model,
        messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt } ],
        max_tokens: 200,
        temperature: 0.85,
      }
      const resp = await axios.post(GROQ_URL, payload, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` }, timeout: 30000 })
      const content = resp.data?.choices?.[0]?.message?.content || ''
      let dilemma = content.trim().split('\n')[0].trim()
      // remove quotes if any
      dilemma = dilemma.replace(/^["']|["']$/g, '')
      return res.status(200).json({ dilemma })
    }catch(e){
      console.error(`Groq error for model=${model}`, e?.response?.data || e.message)
      const code = e?.response?.data?.code || e?.response?.data?.error?.code
      if (code === 'model_not_found') continue
      break
    }
  }

  // fallback
  return res.status(200).json({ dilemma: mockDilemma(round || 1) })
}

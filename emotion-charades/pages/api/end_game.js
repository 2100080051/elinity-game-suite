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

function mockReflection(history, score){
  const rounds = history?.length || 0
  return `What a show! ${rounds} rounds of expressive fun. Scoreboard: P1 ${score?.['Player 1']||0} – P2 ${score?.['Player 2']||0}. Great energy, bold gestures, and lots of laughs. 🎭`
}

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { history, score } = req.body

  const systemPrompt = loadSystemPrompt()
  const GROQ_API_KEY = process.env.GROQ_API_KEY

  if (!GROQ_API_KEY){
    return res.status(200).json({ reflection: mockReflection(history, score) })
  }

  let recap = 'Rounds played:\n'
  for (const r of (history||[])){
    recap += `Round ${r.round} — Actor: ${r.actor} — Prompt: ${r.prompt}. Guesses: ${(r.guesses||[]).map(g=>g.text).join(', ')}\n`
  }

  const userPrompt = `${recap}\nScores: P1 ${score?.['Player 1']||0} – P2 ${score?.['Player 2']||0}.\n\nGive a playful closing remark (1-3 lines) celebrating the group, highlighting a funny or impressive moment, and encouraging them to play again.`

  const models = getModelCandidates()
  for (const model of models){
    try{
      const payload = { model, messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt } ], max_tokens: 120, temperature: 0.85 }
      const resp = await axios.post(GROQ_URL, payload, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` }, timeout: 20000 })
      const content = resp.data?.choices?.[0]?.message?.content || ''
      return res.status(200).json({ reflection: content.trim() })
    }catch(e){
      console.error(`Groq error for model=${model}`, e?.response?.data || e.message)
      const code = e?.response?.data?.code || e?.response?.data?.error?.code
      if (code === 'model_not_found') continue
      break
    }
  }

  return res.status(200).json({ reflection: mockReflection(history, score) })
}

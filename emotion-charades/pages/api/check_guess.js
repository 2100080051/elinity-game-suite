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

function simpleJudge(target, guess){
  const t = (target||'').toLowerCase()
  const g = (guess||'').toLowerCase()
  // extract main emotion word from target
  const match = t.match(/(hopeful|confusion|uncertainty|proud|relief|frustration|nervous|excitement|joy|sad|anger|fear|love|surprise|calm|anxious)/)
  const key = match ? match[1] : t.replace(/[^a-z]/g,'').slice(0,12)
  const correct = key && g.includes(key)
  const hint = correct ? '' : 'Think of a core emotion word (e.g., hopeful, confused, uncertain, proud, relieved, frustrated).'
  return { correct, similarity: correct ? 0.95 : 0.3, hint }
}

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { target, guess } = req.body
  if (!target || !guess) return res.status(400).json({ error: 'target and guess required' })

  const systemPrompt = loadSystemPrompt()
  const GROQ_API_KEY = process.env.GROQ_API_KEY

  if (!GROQ_API_KEY){
    const j = simpleJudge(target, guess)
    return res.status(200).json({ correct: j.correct, similarity: j.similarity, hint: j.hint })
  }

  const userPrompt = `Target emotional charade prompt: "${target}". The guess is: "${guess}". Decide if the guess correctly names the emotion implied by the target. Reply in two lines:\nCorrect: true/false\nHint: <short hint if false>`

  const models = getModelCandidates()
  for (const model of models){
    try{
      const payload = { model, messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt } ], max_tokens: 80, temperature: 0.2 }
      const resp = await axios.post(GROQ_URL, payload, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` }, timeout: 15000 })
      const content = resp.data?.choices?.[0]?.message?.content || ''
      const lines = content.split('\n').map(l=>l.trim()).filter(Boolean)
      let correct = false, hint = ''
      for (const l of lines){
        if (l.toLowerCase().startsWith('correct:')){ correct = /true/i.test(l) }
        else if (l.toLowerCase().startsWith('hint:')){ hint = l.split(':').slice(1).join(':').trim() }
      }
      if (!hint && !correct) hint = 'Try a more basic emotion word.'
      return res.status(200).json({ correct, similarity: correct ? 0.9 : 0.3, hint })
    }catch(e){
      console.error(`Groq error for model=${model}`, e?.response?.data || e.message)
      const code = e?.response?.data?.code || e?.response?.data?.error?.code
      if (code === 'model_not_found') continue
      break
    }
  }

  const j = simpleJudge(target, guess)
  return res.status(200).json({ correct: j.correct, similarity: j.similarity, hint: j.hint })
}

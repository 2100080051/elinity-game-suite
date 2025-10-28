import fs from 'fs'
import path from 'path'
import axios from 'axios'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_FALLBACK_MODELS = ['gpt-4o-mini', 'gpt-3o-mini']

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
    return 'You are ElinityAI, the Game Master for Story Relay.'
  }
}

function mockSummary(story){
  const full = (story||[]).map(s=>`${s.player}: ${s.line}`).join(' ')
  const title = 'The Relayed Adventure'
  const recap = full.length>400? full.slice(0,400)+'...' : full
  const commentary = 'That moon-clock twist was unforgettable.'
  return `Title: ${title}\nRecap: ${recap}\nCommentary: ${commentary}`
}

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { story } = req.body
  const systemPrompt = loadSystemPrompt()

  const GROQ_API_KEY = process.env.GROQ_API_KEY
  if (!GROQ_API_KEY) return res.status(200).json({ result: mockSummary(story) })

  const userPromptLines = [
    "You are ElinityAI. Given the full story below, provide:",
    "1) A short, fun title on its own line prefixed by 'Title:'",
    "2) A concise recap of the full story prefixed by 'Recap:'",
    "3) A short playful commentary highlighting the funniest or strangest twist prefixed by 'Commentary:'",
    '\nFull story lines:'
  ]
  for (const e of story) userPromptLines.push(`- ${e.player}: ${e.line}`)
  const userPrompt = userPromptLines.join('\n')

  // Try model candidates in order
  const models = getModelCandidates()
  for (const model of models){
    try{
      const payload = {
        model,
        messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt } ],
        max_tokens: 600,
        temperature: 0.9,
      }
      const resp = await axios.post(GROQ_URL, payload, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` }, timeout: 60000 })
      const content = resp.data?.choices?.[0]?.message?.content || JSON.stringify(resp.data)
      return res.status(200).json({ result: content })
    }catch(e){
      console.error(`Groq error for model=${model}`, e?.response?.data || e.message)
      const code = e?.response?.data?.code || e?.response?.data?.error?.code
      if (code === 'model_not_found'){
        // try next candidate
        continue
      }
      // other error -> stop and fallback to mock
      break
    }
  }

  // fallback
  return res.status(200).json({ result: mockSummary(story) })
}

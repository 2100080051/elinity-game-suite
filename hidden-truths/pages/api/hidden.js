import fs from 'fs'

const SYSTEM_PROMPT = `You are ElinityAI, the poetic oracle and game master of the social deduction game “Hidden Truths.”\n\nROLE:\nYou guide players through rounds where they reveal small truths through artful disguise.\nYou write in symbolic, emotional, or metaphorical language — mysterious but not too obscure.\nEncourage curiosity, warmth, and connection.\n\nWhen encoding, produce JSON with an array 'items', each item as:\n{ id: string, type: "Riddle" | "Short Poem" | "Art Prompt", text: string, for: string }\nUse beautiful but decipherable language. Keep 1-3 sentences each.`

const FALLBACK_QUESTIONS = [
  "What small act makes you feel most alive?",
  "What dream have you never told anyone?",
  "If you could relive one day, which would it be?",
  "Which place feels like a secret home to you?",
]

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { action, payload } = req.body || {}

  try{
    if(action === 'question'){
      // Try model to craft a question, fallback to curated list
      const q = await modelQuestion()
      return res.status(200).json({ question: q || pick(FALLBACK_QUESTIONS) })
    }

    if(action === 'encode'){
      const { players = [], answers = {} } = payload || {}
      const items = await modelEncode(players, answers)
      return res.status(200).json({ items })
    }

    return res.status(400).json({ error: 'Unknown action' })
  }catch(e){
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
}

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)] }

async function modelQuestion(){
  try{
    const q = await openrouterJSON([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: 'Write one thoughtful, light, shareable question for Hidden Truths.' }
    ], { response_format: { type: 'json_object' } })
    const obj = JSON.parse(q)
    return obj.question || null
  }catch{ return null }
}

async function modelEncode(players, answers){
  // Construct content describing answers
  const list = players.map(name => ({ name, answer: answers[name] || '' })).filter(x => x.answer?.trim())
  const prompt = {
    role: 'user',
    content: `Players: ${list.map(x=>x.name).join(', ')}\nAnswers (keep private):\n${list.map(x=>`- ${x.name}: ${x.answer}`).join('\n')}\n\nCreate a disguised set (mix riddles, short poems, and art prompts). Return JSON: { items: [{id, type, text, for}] }.`
  }
  try{
    const raw = await openrouterJSON([
      { role:'system', content: SYSTEM_PROMPT },
      prompt
    ], { response_format: { type: 'json_object' } })
    const obj = JSON.parse(raw)
    const items = Array.isArray(obj.items) ? obj.items : []
    return sanitizeItems(items, list)
  }catch(e){
    // Fallback: simple local disguises
    return list.map((x, i) => ({
      id: `loc-${i+1}`,
      type: pick(['Riddle', 'Short Poem', 'Art Prompt']),
      text: fallbackDisguise(x.answer),
      for: x.name,
    }))
  }
}

function sanitizeItems(items, list){
  const names = new Set(list.map(x=>x.name))
  const out = []
  for(const it of items){
    if(!it || typeof it !== 'object') continue
    const id = String(it.id || `id-${out.length+1}`)
    const type = ['Riddle','Short Poem','Art Prompt'].includes(it.type) ? it.type : 'Riddle'
    const text = String(it.text || '').slice(0, 500)
    const who = names.has(it.for) ? it.for : list[out.length % list.length]?.name
    out.push({ id, type, text, for: who })
  }
  return out
}

function fallbackDisguise(ans){
  const a = (ans||'').trim()
  if(a.length < 8) return `A single spark under glass, waiting for air.`
  return `A paper boat on a violet river, carrying a whisper that says: "${a.slice(0,80)}"`
}

async function openrouterJSON(messages, extra = {}){
  const apiKey = process.env.OPENROUTER_API_KEY
  const url = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions'
  if(!apiKey) throw new Error('Missing OPENROUTER_API_KEY')
  const body = {
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b:free',
    messages,
    temperature: 0.8,
    ...extra,
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3030',
      'X-Title': 'Hidden Truths'
    },
    body: JSON.stringify(body)
  })
  if(!res.ok){ throw new Error('OpenRouter error') }
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || '{}'
  // Attempt safe JSON extraction
  try{ return JSON.stringify(JSON.parse(content)) }catch{
    // heuristic: extract between first { and last }
    const first = content.indexOf('{'); const last = content.lastIndexOf('}')
    if(first>=0 && last>first){ return content.slice(first, last+1) }
    throw new Error('Bad JSON from model')
  }
}

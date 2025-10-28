const SYSTEM_PROMPT = `You are ElinityAI — the master strategist and narrator of “The AI Heist.”\n\nYour role:\nAct as the heist’s game master. You generate dynamic scenarios, present obstacles, narrate tension, and simulate outcomes.\nBalance realism, creativity, and suspense.\n\nWhen returning JSON, Always and only return valid JSON with the exact fields requested. No markdown fences. Be concise.`

const FALLBACK_MISSIONS = [
  { name: 'Solaris Bank Prototype', location: 'Neon-lit casino in Monaco', objective: 'Steal the AI chip prototype', difficulty: 'Hard' },
  { name: 'Asteria Gallery', location: 'High-security art museum in Tokyo', objective: 'Swap the original with a forgery', difficulty: 'Medium' },
  { name: 'Helix Vault', location: 'AI data vault beneath mega-corp HQ', objective: 'Extract the blackbox dataset', difficulty: 'Hard' },
]

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { action, payload } = req.body || {}
  try{
    if(action === 'mission'){
      const m = await mission()
      return res.status(200).json(m || pick(FALLBACK_MISSIONS))
    }
    if(action === 'brief'){
      const { players = [], mission } = payload || {}
      const intro = await introBrief(players, mission)
      return res.status(200).json({ intro: intro || fallbackIntro(mission) })
    }
    if(action === 'plan'){
      const { players = [], mission, plan = '' } = payload || {}
      const response = await planFeedback(players, mission, plan)
      return res.status(200).json({ response: response || fallbackPlan(plan) })
    }
    if(action === 'act'){
      const { players = [], mission, action: act } = payload || {}
      const out = await actResult(players, mission, act)
      return res.status(200).json(out || fallbackAct(act))
    }
    if(action === 'twist'){
      const { players = [], mission, tension = 50 } = payload || {}
      const twist = await twistEvent(players, mission, tension)
      return res.status(200).json({ twist: twist || fallbackTwist() })
    }
    if(action === 'debrief'){
      const { players = [], mission, log = [], tension = 0 } = payload || {}
      const summary = await debriefSummary(players, mission, log, tension)
      return res.status(200).json({ summary: summary || fallbackDebrief(players, mission, log) })
    }
    return res.status(400).json({ error: 'Unknown action' })
  }catch(e){ console.error(e); return res.status(500).json({ error: 'Server error' }) }
}

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)] }

async function mission(){
  try{
    const content = await openrouterJSON([
      { role:'system', content: SYSTEM_PROMPT },
      { role:'user', content: 'Return JSON { name, location, objective, difficulty } for a cinematic heist mission.' }
    ], { response_format: { type: 'json_object' } })
    return JSON.parse(content)
  }catch{ return null }
}

async function introBrief(players, mission){
  try{
    const names = players.map(p=> p.name + (p.role? ` (${p.role})` : '')).join(', ')
    const prompt = `Team: ${names}. Mission: ${mission?.name} at ${mission?.location}. Objective: ${mission?.objective}. In 3-5 sentences, dramatic intro.`
    const content = await openrouterJSON([
      { role:'system', content: SYSTEM_PROMPT },
      { role:'user', content: prompt }
    ], { response_format: { type: 'json_object' } })
    const obj = JSON.parse(content)
    return obj.intro || null
  }catch{ return null }
}

async function planFeedback(players, mission, plan){
  try{
    const prompt = `Plan: ${plan}. Return JSON { response } with 2-3 sentences: evaluate risk, suggest tweaks, and set tone for execution.`
    const content = await openrouterJSON([
      { role:'system', content: SYSTEM_PROMPT },
      { role:'user', content: prompt }
    ], { response_format: { type: 'json_object' } })
    return JSON.parse(content).response || null
  }catch{ return null }
}

async function actResult(players, mission, act){
  try{
    const prompt = `Action: ${act}. Return JSON { narration, outcome, tensionDelta, next } where next in ["continue","twist","escape"]. 2-3 sentences cinematic.`
    const content = await openrouterJSON([
      { role:'system', content: SYSTEM_PROMPT },
      { role:'user', content: prompt }
    ], { response_format: { type: 'json_object' } })
    return JSON.parse(content)
  }catch{ return null }
}

async function twistEvent(players, mission, tension){
  try{
    const prompt = `Tension: ${tension}. Return JSON { twist } one unexpected event that forces adaptive teamwork (2 sentences).`
    const content = await openrouterJSON([
      { role:'system', content: SYSTEM_PROMPT },
      { role:'user', content: prompt }
    ], { response_format: { type: 'json_object' } })
    return JSON.parse(content).twist || null
  }catch{ return null }
}

async function debriefSummary(players, mission, log, tension){
  try{
    const prompt = `Players: ${players.map(p=>p.name+(p.role?`(${p.role})`:'')).join(', ')}. Mission:${mission?.name}. Log:${log.join(' | ')}. Return JSON { summary } 3-5 lines, include cinematic stats labels like MVP Hacker.`
    const content = await openrouterJSON([
      { role:'system', content: SYSTEM_PROMPT },
      { role:'user', content: prompt }
    ], { response_format: { type: 'json_object' } })
    return JSON.parse(content).summary || null
  }catch{ return null }
}

async function openrouterJSON(messages, extra = {}){
  const apiKey = process.env.OPENROUTER_API_KEY
  const url = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions'
  if(!apiKey) throw new Error('Missing OPENROUTER_API_KEY')
  const body = {
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b:free',
    messages,
    temperature: 0.85,
    ...extra,
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3031',
      'X-Title': 'The AI Heist'
    },
    body: JSON.stringify(body)
  })
  if(!res.ok) throw new Error('OpenRouter error')
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || '{}'
  try{ return JSON.stringify(JSON.parse(content)) }catch{
    const first = content.indexOf('{'); const last = content.lastIndexOf('}')
    if(first>=0 && last>first){ return content.slice(first, last+1) }
    throw new Error('Bad JSON from model')
  }
}

function fallbackIntro(m){
  return `Tonight, the vault at ${m?.name || 'Helix Vault'} beckons beneath ${m?.location || 'a rain-slick megacity'}. The take? ${m?.objective || 'the AI core'}. Masks on. Engines purr. The city holds its breath.`
}
function fallbackPlan(plan){ return `Noted. ${plan || 'A bold approach'} could work — keep comms tight, and watch the cameras. We move on my mark.` }
function fallbackAct(act){ return { narration: `You move to ${act || 'advance'} — lights stutter as a drone pivots.` , outcome: 'mixed', tensionDelta: 8, next: 'continue' } }
function fallbackTwist(){ return `Your insider pings: the vault AI rerouted power — the service corridor just became a trap. Adapt fast.` }
function fallbackDebrief(players, mission, log){ return `Under neon rain, you escape with grit. ${mission?.name || 'The job'} leaves a legend. Logs: ${log.length} pivotal moves. Another vault awaits…` }

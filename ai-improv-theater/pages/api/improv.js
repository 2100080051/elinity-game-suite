const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function cleanJSONString(str) {
  if (typeof str !== 'string') return str
  const fence = str.replace(/^```(json)?/gi, '').replace(/```$/g, '').trim()
  const first = fence.indexOf('{'); const last = fence.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) return fence.slice(first, last + 1)
  return fence
}
function safeParse(str, fallback = {}) { try { return JSON.parse(cleanJSONString(str)) } catch { return fallback } }

function systemPrompt() {
  return `You are ElinityAI, the energetic and witty Director for the game “AI Improv Theater.”
ROLE:
You generate creative, unpredictable improv scenes and act as a scene partner, director, and narrator.
Encourage players to be expressive, silly, and imaginative — keep the energy high and flow smooth.
GOAL:
Facilitate dynamic improv sessions where players act out scenes you describe.
Keep scenes escalating in energy, fun, and creativity until a natural or comedic conclusion.
TONE: Fun, fast-paced, creative, inclusive. Use short 2–4 sentence turns. No politics or dark themes; keep PG-13.
Always respond in strict JSON only (no code fences).`
}

async function callOpenRouter(messages, schema) {
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
  const key = process.env.OPENROUTER_API_KEY
  if (!key) {
    return { choices: [{ message: { content: JSON.stringify(schema) } }] }
  }
  const headers = {
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3029',
    'X-Title': 'AI Improv Theater'
  }
  const body = { model, messages, response_format: { type: 'json_object' }, temperature: 0.95 }
  const res = await fetch(OPENROUTER_URL, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

function buildMessages(action, payload) {
  return [{ role: 'system', content: systemPrompt() }, { role: 'user', content: JSON.stringify({ action, payload }) }]
}

function fallbackScene(theme, players) {
  return {
    scene: `You’re pirates applying for a job at a corporate office (${theme || 'Random'}).`,
    setting: 'A glass-walled boardroom with a bowl of gold-foil chocolates.',
    roles: [
      `${players?.[0] || 'Player 1'} — Captain Resume`,
      `${players?.[1] || 'Player 2'} — HR Buccaneer`,
      'AI — The Interviewer Parrot'
    ],
    intro: 'Welcome aboard! Keep it bold, keep it silly — and yes-and your way through!'
  }
}

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { action, payload } = req.body || {}
  try {
    if (action === 'scene') {
      const schema = fallbackScene(payload?.theme, payload?.players)
      const or = await callOpenRouter(buildMessages('scene', payload), schema)
      const content = or?.choices?.[0]?.message?.content || JSON.stringify(schema)
      const data = safeParse(content, schema)
      return res.status(200).json(data)
    }
    if (action === 'reply') {
      const base = { reply: 'Short dynamic reply with a playful twist.' }
      const or = await callOpenRouter(buildMessages('reply', payload), base)
      const content = or?.choices?.[0]?.message?.content || JSON.stringify(base)
      const data = safeParse(content, base)
      return res.status(200).json({ reply: data.reply || base.reply })
    }
    if (action === 'escalate') {
      const base = { twist: 'A surprising escalation appears!' }
      const or = await callOpenRouter(buildMessages('escalate', payload), base)
      const content = or?.choices?.[0]?.message?.content || JSON.stringify(base)
      const data = safeParse(content, base)
      return res.status(200).json({ twist: data.twist || base.twist })
    }
    if (action === 'add_character') {
      const base = { character: 'A quirky NPC joins with a one-line intro.' }
      const or = await callOpenRouter(buildMessages('add_character', payload), base)
      const content = or?.choices?.[0]?.message?.content || JSON.stringify(base)
      const data = safeParse(content, base)
      return res.status(200).json({ character: data.character || base.character })
    }
    if (action === 'end') {
      const base = { ending: 'A humorous wrap-up and bow.' }
      const or = await callOpenRouter(buildMessages('end', payload), base)
      const content = or?.choices?.[0]?.message?.content || JSON.stringify(base)
      const data = safeParse(content, base)
      return res.status(200).json({ ending: data.ending || base.ending })
    }
    if (action === 'feedback') {
      const base = { recap: 'That was hilarious! 10/10 for comedic chaos.', score: 10 }
      const or = await callOpenRouter(buildMessages('feedback', payload), base)
      const content = or?.choices?.[0]?.message?.content || JSON.stringify(base)
      const data = safeParse(content, base)
      return res.status(200).json({ recap: data.recap || base.recap, score: data.score || base.score })
    }
    return res.status(400).json({ error: 'Unknown action' })
  } catch (e) {
    console.error('improv api error', e)
    return res.status(200).json({ error: 'AI unavailable, using fallback', ...(action==='scene' ? fallbackScene(payload?.theme, payload?.players) : {}) })
  }
}

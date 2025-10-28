export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { action, payload } = req.body || {}
  try{
    if(action === 'prompt'){
      const out = await aiJSON(
        SYSTEM,
        [
          { role:'user', content: 'Generate a whimsical poetic prompt (7-20 words). No quotes. Avoid proper nouns. Tone: playful, elegant.' }
        ],
        'PoemPrompt',
        { type:'object', properties:{ prompt:{ type:'string' } }, required:['prompt'], additionalProperties:false }
      )
      return res.status(200).json({ prompt: out?.prompt || fallbackPrompt() })
    }

    if(action === 'ai_line'){
      const { prompt, soFar } = payload || {}
      const context = Array.isArray(soFar) ? soFar.map(l=> `${l.role === 'ai' ? 'AI' : 'Player'}: ${l.text}`).join('\n') : ''
      const out = await aiJSON(
        SYSTEM,
        [
          { role:'user', content: `Prompt: ${prompt}\nPoem so far:\n${context}\nContinue with one poetic line (max 14 words). Avoid rhymes if already rhymed; vary imagery.` }
        ],
        'PoemLine',
        { type:'object', properties:{ line:{ type:'string' } }, required:['line'], additionalProperties:false }
      )
      return res.status(200).json({ line: sanitizeLine(out?.line) || 'and the quill paints a hush between heartbeats' })
    }

    if(action === 'recite'){
      const { prompt, lines } = payload || {}
      const poem = Array.isArray(lines) ? lines.map(l=> l.text).join('\n') : ''
      const out = await aiJSON(
        SYSTEM,
        [
          { role:'user', content: `Prompt: ${prompt}\nPoem so far:\n${poem}\nOffer a short couplet to gracefully conclude (1-2 lines, <= 18 words total).` }
        ],
        'PoemFinale',
        { type:'object', properties:{ finale:{ type:'string' } }, required:['finale'], additionalProperties:false }
      )
      return res.status(200).json({ finale: out?.finale?.slice(0, 160) || '— a bow of ink, a final glimmer.' })
    }

    return res.status(400).json({ error: 'Unknown action' })
  }catch(e){
    console.error('poem api error', e)
    return res.status(500).json({ error: 'Server error' })
  }
}

const SYSTEM = `You are a refined, whimsical poet-assistant for a playful game. Reply ONLY in strict JSON as requested. Keep outputs family-friendly. Prefer concrete, evocative imagery over cliches. Moderate tone to be inclusive and kind. Avoid proper nouns unless explicitly asked. Keep lines succinct and readable.`

function sanitizeLine(s){
  if(!s) return ''
  return String(s).replace(/\s+/g,' ').trim().slice(0, 120)
}

async function aiJSON(system, messages, schemaName, jsonSchema){
  const key = process.env.OPENROUTER_API_KEY
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions'
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
  if(!key){
    // Fallback local stubs when no key is configured
    return localStub(schemaName, messages)
  }
  const body = {
    model,
    messages: [ { role:'system', content: system }, ...messages ],
    temperature: 0.9,
    response_format: {
      type: 'json_schema',
      json_schema: { name: schemaName, schema: jsonSchema, strict: true }
    }
  }
  try{
    const r = await fetch(baseUrl, {
      method:'POST',
      headers: {
        'Content-Type':'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3032',
        'X-Title': 'Epic Poem Duel'
      },
      body: JSON.stringify(body)
    })
    const j = await r.json()
    const raw = j?.choices?.[0]?.message?.content
    if(!raw) throw new Error('No content')
    const parsed = safeParseJSON(raw)
    if(parsed) return parsed
  }catch(e){
    console.warn('openrouter fallback', e?.message)
  }
  return localStub(schemaName, messages)
}

function safeParseJSON(s){
  try{ return JSON.parse(s) }catch{ return null }
}

function localStub(schemaName, messages){
  if(schemaName === 'PoemPrompt'){
    return { prompt: fallbackPrompt() }
  }
  if(schemaName === 'PoemLine'){
    const lastUser = messages.findLast?.(m=> m.role==='user')?.content || ''
    return { line: 'a lantern of words sways over quiet water' }
  }
  if(schemaName === 'PoemFinale'){
    return { finale: 'Ink settles softly — a hush of gold and clover.' }
  }
  return {}
}

function fallbackPrompt(){
  const seeds = [
    'A teacup storms with polite thunder',
    'Footsteps weave ribbons through moonlit wheat',
    'Library dust remembers lullabies',
    'A kite negotiates with a stubborn sky',
    'Clouds write postcards to the sea'
  ]
  return seeds[Math.floor(Math.random()*seeds.length)]
}

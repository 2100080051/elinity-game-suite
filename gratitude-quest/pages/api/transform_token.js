import axios from 'axios'

const SYSTEM_PROMPT = `You are ElinityAI, the gentle and creative guide for “Gratitude Quest,” a game that transforms player gratitude into symbolic art.

GOAL:
Encourage players to express appreciation, then visualize each gratitude as a meaningful symbol.

TONE:
- Gentle, poetic, uplifting
- Never judgmental or evaluative
- Language should evoke imagery and calm emotion

RULES:
- Tokens must be symbolic, not literal
- Avoid religion or moral judgment
- Keep each transformation under 40 words

STRICT OUTPUT:
Return ONLY a single valid JSON object. Do NOT include backticks, explanations, or extra text. Keys exactly:
{
  "token_name": "short symbolic name (e.g., Amber Light)",
  "symbol_description": "one-sentence symbolic description (<40 words)",
  "emoji": "one relevant emoji",
  "image_prompt": "a descriptive prompt for an image generator (no brand names)"
}`

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { gratitude } = req.body
  if (!gratitude || !gratitude.trim()) return res.status(400).json({ error: 'Missing gratitude text' })

  try{
    const apiKey = process.env.OPENROUTER_API_KEY
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b:free'
    if(!apiKey) return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY' })

    const userPrompt = `Transform this gratitude into a symbolic token. Output must be ONLY JSON with keys: token_name, symbol_description, emoji, image_prompt. Gratitude: "${gratitude}"`

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
      max_tokens: 300
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3022',
        'X-Title': 'Gratitude Quest'
      }
    })

    const aiText = (response.data?.choices?.[0]?.message?.content || '').trim()

    let clean = aiText.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
    if (!clean.startsWith('{')){
      const s = clean.indexOf('{');
      const e = clean.lastIndexOf('}');
      if (s !== -1 && e !== -1 && e > s) clean = clean.slice(s, e + 1)
    }

    let token
    try{
      token = JSON.parse(clean)
    }catch(e){
      token = { token_name: 'Gratitude Light', symbol_description: 'A soft light symbolizing your appreciation.', emoji: '✨', image_prompt: 'soft glowing orb in pastel gradients, serene, tranquil' }
    }

    return res.status(200).json({ token })
  }catch(err){
    console.error('transform_token error:', err.response?.data || err.message)
    return res.status(500).json({ error: 'Failed to transform gratitude', details: err.response?.data || err.message })
  }
}

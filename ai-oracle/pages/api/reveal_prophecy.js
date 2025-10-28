import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { session, question } = req.body
  if (!question) return res.status(400).json({ error: 'Missing question' })

  // Maybe draw a symbol (30% chance)
  let drawn_symbol = null
  if (session?.symbols?.length && Math.random() < 0.3){
    drawn_symbol = session.symbols[Math.floor(Math.random() * session.symbols.length)]
  }

  // Read system prompt
  const systemPromptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  const systemPrompt = fs.existsSync(systemPromptPath) ? fs.readFileSync(systemPromptPath, 'utf-8') : 'You are ElinityAI, the Oracle of Time and Code.'

  const groqApiKey = process.env.GROQ_API_KEY
  const groqModel = process.env.GROQ_MODEL || 'groq/compound'

  const baseUserPrompt = `A player asks: "${question}"\nRespond with a symbolic prophecy of 2-5 poetic lines using imagery of nature, stars, time, light, and transformation. Avoid literal advice. ${drawn_symbol ? `Reference the symbol "${drawn_symbol.name}" subtly.` : ''}`

  if (groqApiKey){
    try{
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: groqModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: baseUserPrompt }
        ],
        temperature: 0.95,
        max_tokens: 180
      }, {
        headers: { Authorization: `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' }
      })

      const prophecy = response.data.choices[0]?.message?.content || 'The wind writes in circles upon a quiet lake.'
      const invite = 'What does this mean to you, seeker?'

      // Update session history
      const updated = session || { history: [] }
      if (!updated.history) updated.history = []
      updated.history.push({ question, prophecy, drawn_symbol, at: new Date().toISOString() })

      return res.status(200).json({ prophecy, invite, drawn_symbol, session: updated })
    }catch(err){
      console.error('Groq error:', err.response?.data || err.message)
      // fall through to mock
    }
  }

  // Mock fallback
  const lines = [
    'A door of silver light stands before you.',
    'Behind it, a garden grows where patience blooms.',
    'Follow the quiet river; it knows the way.',
    'When the starlit mirror clears, your shape will sharpen.',
    'The path bends, not to deny you, but to teach your feet to dance.'
  ]
  const prophecy = lines.slice(0, 3 + Math.floor(Math.random()*3)).join('\n')
  const invite = 'What does this mean to you, seeker?'

  const updated = session || { history: [] }
  if (!updated.history) updated.history = []
  updated.history.push({ question, prophecy, drawn_symbol, at: new Date().toISOString() })

  return res.status(200).json({ prophecy, invite, drawn_symbol, session: updated })
}

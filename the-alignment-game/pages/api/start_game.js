import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' })
  const { players } = req.body
  if (!players || players.length < 2) return res.status(400).json({ error:'Need at least 2 players' })

  const systemPromptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  const systemPrompt = fs.existsSync(systemPromptPath) ? fs.readFileSync(systemPromptPath, 'utf-8') : ''

  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo'

  const session = {
    players,
    rounds: [],
    started_at: new Date().toISOString(),
    systemPrompt
  }

  let greeting = 'Welcome to The Alignment Game! Let\'s see how in-sync your vibes really are.'
  let question = 'Beach or Mountains?'
  let choices = ['🏖️ Beach', '⛰️ Mountains']

  if (apiKey){
    try{
      const prompt = `You are the Game Master for "The Alignment Game" with ${players.length} players: ${players.join(', ')}.

Write an energetic greeting (1-2 sentences) welcoming them, then generate one fun dilemma question with exactly 2 choice options (with emojis).

Format your response EXACTLY like this:
GREETING: [your energetic welcome message]
QUESTION: [a fun dilemma question]
CHOICE_A: [first option with emoji]
CHOICE_B: [second option with emoji]

Make the question quick, fun, and easy to answer!`

      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 250
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3017',
          'X-Title': 'The Alignment Game'
        }
      })

      const text = (response.data.choices[0]?.message?.content || '').trim()
      const greetMatch = text.match(/GREETING:\s*(.+?)(?=\n|QUESTION:|$)/is)
      const qMatch = text.match(/QUESTION:\s*(.+?)(?=\n|CHOICE_A:|$)/is)
      const aMatch = text.match(/CHOICE_A:\s*(.+?)(?=\n|CHOICE_B:|$)/is)
      const bMatch = text.match(/CHOICE_B:\s*(.+?)(?=\n|$)/is)

      if (greetMatch) greeting = greetMatch[1].trim()
      if (qMatch) question = qMatch[1].trim()
      if (aMatch && bMatch) choices = [aMatch[1].trim(), bMatch[1].trim()]
    }catch(err){
      console.error('OpenRouter start error:', err.response?.data || err.message)
      console.error('Full error:', err)
    }
  }

  return res.status(200).json({ greeting, question, choices, session })
}

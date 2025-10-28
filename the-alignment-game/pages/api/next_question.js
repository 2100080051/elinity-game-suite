import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' })
  const { session, round } = req.body

  const systemPromptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  const systemPrompt = fs.existsSync(systemPromptPath) ? fs.readFileSync(systemPromptPath, 'utf-8') : ''

  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo'

  let question = 'Coffee or Tea?'
  let choices = ['☕ Coffee', '🍵 Tea']

  if (apiKey){
    try{
      const askedQuestions = session.rounds && session.rounds.length > 0 
        ? session.rounds.map(r => r.question).join('\n• ')
        : 'none yet'
      
      const prompt = `Generate a COMPLETELY NEW and DIFFERENT fun dilemma question for "The Alignment Game".

IMPORTANT: DO NOT repeat or rephrase any of these already-asked questions:
${askedQuestions}

Create a fresh, unique question with exactly 2 choice options (include emojis). Make it fun, quick to answer, and engaging.

Format your response EXACTLY like this:
QUESTION: [your new dilemma question]
CHOICE_A: [first option with emoji]
CHOICE_B: [second option with emoji]

Examples of good question types: preferences (sweet vs savory), lifestyle (early bird vs night owl), personality (planner vs spontaneous), activities (hiking vs beach), etc.`

      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 1.0,
        max_tokens: 200
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3017',
          'X-Title': 'The Alignment Game'
        }
      })

      const text = (response.data.choices[0]?.message?.content || '').trim()
      const qMatch = text.match(/QUESTION:\s*(.+?)(?=\n|CHOICE_A:|$)/is)
      const aMatch = text.match(/CHOICE_A:\s*(.+?)(?=\n|CHOICE_B:|$)/is)
      const bMatch = text.match(/CHOICE_B:\s*(.+?)(?=\n|$)/is)

      if (qMatch) question = qMatch[1].trim()
      if (aMatch && bMatch) choices = [aMatch[1].trim(), bMatch[1].trim()]
    }catch(err){
      console.error('OpenRouter next question error:', err.response?.data || err.message)
      console.error('Full error:', err)
    }
  }

  return res.status(200).json({ question, choices, session })
}

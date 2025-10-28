import axios from 'axios'

const SYSTEM_PROMPT = `You are ElinityAI, roleplaying as a witness in a micro-mystery game.

Your role:
- Stay in character as the witness
- Provide clues mixed with distractions
- Be vivid and theatrical
- Keep responses under 100 words
- Don't reveal the solution directly
- Give enough hints that a clever detective can solve it

Tone: playful, engaging, slightly mysterious`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { question, mystery, chat_history } = req.body

  if (!question || !mystery) {
    return res.status(400).json({ error: 'Missing question or mystery data' })
  }

  try {
    const apiKey = process.env.OPENROUTER_API_KEY
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b:free'
    if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY')
    
    // Build conversation context
    const messages = [
      { 
        role: 'system', 
        content: `${SYSTEM_PROMPT}\n\nMystery context:\n${mystery.scene}\n\nYou are: ${mystery.witness_persona}\n\nActual solution (don't reveal directly): ${mystery.solution_key}` 
      }
    ]

    // Add recent chat history for context
    if (chat_history && chat_history.length > 0) {
      const recentHistory = chat_history.slice(-6) // Last 6 messages
      recentHistory.forEach(msg => {
        messages.push({
          role: msg.type === 'player' ? 'user' : 'assistant',
          content: msg.text
        })
      })
    }

    // Add current question
    messages.push({ role: 'user', content: question })

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages,
        temperature: 0.8,
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3019',
          'X-Title': 'Micro-Mysteries'
        }
      }
    )

    const answer = response.data.choices[0].message.content.trim()

    res.status(200).json({ answer })

  } catch (error) {
    console.error('ask_question error:', error.response?.data || error.message)
    res.status(500).json({ 
      error: 'Failed to get answer',
      details: error.response?.data || error.message 
    })
  }
}

import axios from 'axios'

const SYSTEM_PROMPT = `You are ElinityAI, the Game Master for Micro-Mysteries.

The player has submitted their final guess. Your job:

1. Evaluate if their guess is correct (or close enough)
2. Reveal the actual solution
3. Provide a witty, satisfying outro line

Return a JSON object with:
{
  "correct": true/false,
  "explanation": "detailed explanation of what actually happened",
  "witty_outro": "a short, clever closing line"
}

Be generous but fair in judging correctness. If they got the main idea right, count it as correct even if minor details differ.

Keep explanation under 150 words. Make it satisfying and clear.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { player_guess, mystery, chat_history } = req.body

  if (!player_guess || !mystery) {
    return res.status(400).json({ error: 'Missing guess or mystery data' })
  }

  try {
    const apiKey = process.env.OPENROUTER_API_KEY
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b:free'
    if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY')
    
    const prompt = `Mystery: ${mystery.scene}

Actual solution: ${mystery.solution_key}

Player's guess: ${player_guess}

Evaluate the player's guess and provide the reveal. Return ONLY valid JSON.`

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
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

    const aiText = response.data.choices[0].message.content.trim()
    
    // Parse JSON response
    let result
    try {
      const cleanText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      result = JSON.parse(cleanText)
    } catch (e) {
      // Fallback if parsing fails
      result = {
        correct: false,
        explanation: aiText,
        witty_outro: "Another mystery awaits, detective!"
      }
    }

    res.status(200).json(result)

  } catch (error) {
    console.error('reveal_solution error:', error.response?.data || error.message)
    res.status(500).json({ 
      error: 'Failed to reveal solution',
      details: error.response?.data || error.message 
    })
  }
}

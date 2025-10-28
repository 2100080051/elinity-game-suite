import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { players } = req.body
  if (!players || players.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 players' })
  }

  // Read system prompt
  const systemPromptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  const systemPrompt = fs.existsSync(systemPromptPath)
    ? fs.readFileSync(systemPromptPath, 'utf-8')
    : 'You are ElinityAI, a fortune-teller host for Future Forecast. Create fun, positive predictions about players.'

  // Create game session
  const session = {
    players,
    rounds: [],
    started_at: new Date().toISOString()
  }

  // Question categories
  const questionTemplates = [
    { template: "What will {name} be famous for in 10 years?", category: "fame" },
    { template: "Where will {name} be living in 2035?", category: "location" },
    { template: "What unexpected invention will {name} create?", category: "invention" },
    { template: "What wild adventure awaits {name} in the next decade?", category: "adventure" },
    { template: "What unusual hobby will {name} master by 2030?", category: "lifestyle" },
    { template: "What award will {name} win in the future?", category: "achievement" }
  ]

  // Pick random player and question for first round
  const targetPlayer = players[Math.floor(Math.random() * players.length)]
  const questionTemplate = questionTemplates[Math.floor(Math.random() * questionTemplates.length)]
  const firstQuestion = {
    question: questionTemplate.template.replace('{name}', targetPlayer),
    target_player: targetPlayer,
    category: questionTemplate.category
  }

  // Generate welcome message using Groq
  const groqApiKey = process.env.GROQ_API_KEY
  const groqModel = process.env.GROQ_MODEL || 'groq/compound'

  if (groqApiKey) {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Welcome ${players.length} players: ${players.join(', ')} to Future Forecast. Write a fun, mystical welcome (2-3 sentences). Tone: fortune-teller meets comedian.`
            }
          ],
          temperature: 0.9,
          max_tokens: 150
        },
        {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const welcome_message = response.data.choices[0]?.message?.content || 'Welcome to Future Forecast! The crystal is ready to reveal your destinies.'

      return res.status(200).json({
        welcome_message,
        first_question: firstQuestion,
        session
      })
    } catch (error) {
      console.error('Groq API error:', error.response?.data || error.message)
      // Fallback to mock
    }
  }

  // Mock mode fallback
  const welcomeMessages = [
    `Ah, ${players.join(', ')} - the crystal has been expecting you! Gather round as we peer into the mists of time and discover what hilarious futures await.`,
    `Welcome, fortune seekers! The cosmic threads reveal ${players.length} bright destinies ahead. Let's see what the future holds... and whether it includes robot cats or Mars cafes.`,
    `Greetings, ${players[0]}, ${players[1]}${players.length > 2 ? `, and ${players.slice(2).join(', ')}` : ''}! The crystal ball awakens. Your futures are written in the stars - and they're surprisingly entertaining.`
  ]

  const welcome_message = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]

  return res.status(200).json({
    welcome_message,
    first_question: firstQuestion,
    session
  })
}

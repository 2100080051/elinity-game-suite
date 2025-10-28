import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { session, current_round } = req.body
  if (!session) {
    return res.status(400).json({ error: 'Missing session data' })
  }

  // Question categories with templates
  const questionTemplates = [
    { template: "What will {name} be famous for in 10 years?", category: "fame" },
    { template: "Where will {name} be living in 2035?", category: "location" },
    { template: "What unexpected invention will {name} create?", category: "invention" },
    { template: "What wild adventure awaits {name} in the next decade?", category: "adventure" },
    { template: "What unusual hobby will {name} master by 2030?", category: "lifestyle" },
    { template: "What award will {name} win in the future?", category: "achievement" },
    { template: "What surprising career change will {name} make?", category: "career" },
    { template: "What legendary achievement will {name} be remembered for?", category: "legacy" },
    { template: "What does {name}'s dream house look like in 2040?", category: "lifestyle" },
    { template: "What kind of business will {name} run in the future?", category: "career" }
  ]

  // Avoid repeating players too often - pick player who hasn't been targeted recently
  const recentTargets = session.rounds.slice(-2).map(r => r.target)
  const availablePlayers = session.players.filter(p => !recentTargets.includes(p))
  const playerPool = availablePlayers.length > 0 ? availablePlayers : session.players

  // Pick random player and question
  const targetPlayer = playerPool[Math.floor(Math.random() * playerPool.length)]
  const questionTemplate = questionTemplates[Math.floor(Math.random() * questionTemplates.length)]
  
  const newQuestion = {
    question: questionTemplate.template.replace('{name}', targetPlayer),
    target_player: targetPlayer,
    category: questionTemplate.category
  }

  // Read system prompt
  const systemPromptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  const systemPrompt = fs.existsSync(systemPromptPath)
    ? fs.readFileSync(systemPromptPath, 'utf-8')
    : 'You are ElinityAI, a fortune-teller host for Future Forecast.'

  // Optionally use Groq to generate custom question
  const groqApiKey = process.env.GROQ_API_KEY
  const groqModel = process.env.GROQ_MODEL || 'groq/compound'

  if (groqApiKey && Math.random() < 0.4) {
    // 40% chance to generate AI question instead of template
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Generate ONE creative future question about ${targetPlayer}. Categories: career, location, invention, adventure, lifestyle, fame. Keep it fun and specific. Just the question, no explanation.`
            }
          ],
          temperature: 0.9,
          max_tokens: 50
        },
        {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const aiQuestion = response.data.choices[0]?.message?.content?.trim()
      if (aiQuestion && aiQuestion.length < 150) {
        newQuestion.question = aiQuestion
      }
    } catch (error) {
      console.error('AI question generation error:', error.message)
      // Fall back to template question (already set)
    }
  }

  return res.status(200).json({
    question: newQuestion,
    session
  })
}

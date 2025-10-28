import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { session, total_rounds } = req.body
  if (!session || !session.rounds) {
    return res.status(400).json({ error: 'Missing session data' })
  }

  // Read system prompt
  const systemPromptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  const systemPrompt = fs.existsSync(systemPromptPath)
    ? fs.readFileSync(systemPromptPath, 'utf-8')
    : 'You are ElinityAI, a fortune-teller host for Future Forecast.'

  // Prepare round summaries for context
  const roundSummaries = session.rounds
    .map(r => `Round ${r.round}: ${r.question} - Forecast: ${r.forecast}`)
    .join('\n')

  // Generate timeline summary using Groq
  const groqApiKey = process.env.GROQ_API_KEY
  const groqModel = process.env.GROQ_MODEL || 'groq/compound'

  if (groqApiKey) {
    try {
      // Generate overall summary
      const summaryResponse = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Create a final "Timeline Summary" for ${session.players.join(', ')} after ${total_rounds} rounds.

Game Highlights:
${roundSummaries}

Write an entertaining 3-4 sentence wrap-up about their collective futures. Tone: mystical, funny, uplifting.`
            }
          ],
          temperature: 0.9,
          max_tokens: 200
        },
        {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const summary = summaryResponse.data.choices[0]?.message?.content || 'The future holds wonderful surprises for everyone!'

      // Generate individual player future snapshots
      const player_futures = []
      for (const player of session.players) {
        const playerRounds = session.rounds.filter(r => r.target === player)
        const playerContext = playerRounds.map(r => r.forecast).join(' ')

        try {
          const playerResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              model: groqModel,
              messages: [
                { role: 'system', content: systemPrompt },
                {
                  role: 'user',
                  content: `Summarize ${player}'s future path in 2-3 sentences based on: ${playerContext || 'adventure and success'}. Positive and specific.`
                }
              ],
              temperature: 0.85,
              max_tokens: 120
            },
            {
              headers: {
                Authorization: `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
              }
            }
          )

          const future_snapshot = playerResponse.data.choices[0]?.message?.content || `${player}'s future is bright and full of surprises!`
          player_futures.push({ player, future_snapshot })
        } catch (playerError) {
          console.error(`Error generating future for ${player}:`, playerError.message)
          player_futures.push({
            player,
            future_snapshot: `${player}'s path leads to unexpected joy, creative success, and adventures beyond imagination!`
          })
        }
      }

      return res.status(200).json({
        timeline_summary: {
          summary,
          player_futures
        }
      })
    } catch (error) {
      console.error('Groq API error:', error.response?.data || error.message)
      // Fallback to mock
    }
  }

  // Mock mode fallback
  const summary = `As the crystal dims, the visions become clear: ${session.players.join(', ')} share a future filled with unexpected twists, robot cats, Mars cafes, and achievements that historians will debate for centuries. The timeline is written - and it's absolutely hilarious.`

  const player_futures = session.players.map(player => {
    const playerRounds = session.rounds.filter(r => r.target === player)
    const hasRounds = playerRounds.length > 0

    const snapshots = [
      `${player} embarks on a journey from humble beginnings to cosmic greatness, collecting achievements and good vibes along the way. The future remembers ${player} fondly - and with a few amusing footnotes.`,
      `The timeline shows ${player} mastering unexpected skills, living in surprising places, and generally being awesome. By 2035, ${player}'s name is synonymous with creativity and excellent decision-making.`,
      `${player}'s path winds through adventures, inventions, and the occasional robot cat. The crystal confirms: ${player} lives a life full of laughter, success, and stories worth telling.`
    ]

    return {
      player,
      future_snapshot: snapshots[Math.floor(Math.random() * snapshots.length)]
    }
  })

  return res.status(200).json({
    timeline_summary: {
      summary,
      player_futures
    }
  })
}

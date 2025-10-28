import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { session, question, predictions, round } = req.body
  if (!session || !question || !predictions) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Read system prompt
  const systemPromptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  const systemPrompt = fs.existsSync(systemPromptPath)
    ? fs.readFileSync(systemPromptPath, 'utf-8')
    : 'You are ElinityAI, a fortune-teller host for Future Forecast. Create fun, positive predictions about players.'

  // Format predictions for AI
  const predictionsList = Object.entries(predictions)
    .map(([player, prediction]) => `${player}: "${prediction}"`)
    .join('\n')

  // 30% chance of bonus twist
  const shouldHaveTwist = Math.random() < 0.3

  // Generate forecast using Groq
  const groqApiKey = process.env.GROQ_API_KEY
  const groqModel = process.env.GROQ_MODEL || 'groq/compound'

  if (groqApiKey) {
    try {
      const mainPrompt = `Question: "${question.question}"
Target: ${question.target_player}

Player Predictions:
${predictionsList}

Blend these predictions into ONE entertaining forecast (3-4 sentences). Be creative, funny, and positive. Use phrases like "The crystal reveals..." or "In an unexpected twist..." Start with the result.`

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: mainPrompt }
          ],
          temperature: 0.95,
          max_tokens: 200
        },
        {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const forecast = response.data.choices[0]?.message?.content || 'The future looks bright and full of surprises!'

      // Generate bonus twist if applicable
      let bonus_twist = null
      if (shouldHaveTwist) {
        try {
          const twistResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              model: groqModel,
              messages: [
                { role: 'system', content: systemPrompt },
                {
                  role: 'user',
                  content: `Add a brief BONUS TWIST to this forecast about ${question.target_player} (1 sentence, funny/surprising): ${forecast}`
                }
              ],
              temperature: 1.0,
              max_tokens: 80
            },
            {
              headers: {
                Authorization: `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
              }
            }
          )
          bonus_twist = twistResponse.data.choices[0]?.message?.content
        } catch (twistError) {
          console.error('Twist generation error:', twistError.message)
        }
      }

      // Update session
      session.rounds.push({
        round,
        question: question.question,
        target: question.target_player,
        predictions,
        forecast,
        bonus_twist
      })

      return res.status(200).json({
        forecast,
        bonus_twist,
        session
      })
    } catch (error) {
      console.error('Groq API error:', error.response?.data || error.message)
      // Fallback to mock
    }
  }

  // Mock mode fallback
  const predictionValues = Object.values(predictions)
  const firstPred = predictionValues[0] || 'something amazing'
  const secondPred = predictionValues[1] || 'something unexpected'

  const mockForecasts = [
    `The crystal reveals a fascinating future for ${question.target_player}! By combining ${firstPred} with ${secondPred}, the timeline shows an unexpected path filled with creativity and adventure. The universe has quite the surprise in store.`,
    `Ah, the threads of destiny converge! ${question.target_player} will journey from ${firstPred} to ${secondPred}, creating a unique story that no one saw coming. The future is delightfully unpredictable.`,
    `In the year 2030, ${question.target_player} achieves something remarkable: ${firstPred} meets ${secondPred} in the most entertaining way possible. The cosmos has a sense of humor, it seems.`,
    `Plot twist incoming! ${question.target_player}'s future involves ${firstPred}, but with an unexpected element of ${secondPred}. The crystal shows laughter, success, and a few pleasant surprises along the way.`
  ]

  const forecast = mockForecasts[Math.floor(Math.random() * mockForecasts.length)]

  let bonus_twist = null
  if (shouldHaveTwist) {
    const twists = [
      `And somehow, a robot cat becomes mayor in the process!`,
      `Turns out, this all happens on Mars. Classic ${question.target_player}.`,
      `The best part? It's all powered by cosmic good vibes and excellent wifi.`,
      `Bonus: Time travelers from 2050 confirm this actually happens!`,
      `The future historians will write entire books about this moment.`
    ]
    bonus_twist = twists[Math.floor(Math.random() * twists.length)]
  }

  // Update session
  session.rounds.push({
    round,
    question: question.question,
    target: question.target_player,
    predictions,
    forecast,
    bonus_twist
  })

  return res.status(200).json({
    forecast,
    bonus_twist,
    session
  })
}

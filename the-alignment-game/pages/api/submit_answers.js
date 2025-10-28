import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' })
  const { session, question, choices, playerChoices, round } = req.body
  if (!session || !playerChoices) return res.status(400).json({ error:'Missing data' })

  const systemPromptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  const systemPrompt = fs.existsSync(systemPromptPath) ? fs.readFileSync(systemPromptPath, 'utf-8') : ''

  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo'

  // Calculate alignment
  const choiceCount = {}
  const breakdown = {}
  session.players.forEach(p => {
    const choiceIdx = playerChoices[p]
    const choice = choices[choiceIdx]
    choiceCount[choice] = (choiceCount[choice] || 0) + 1
    breakdown[choice] = choiceCount[choice]
  })

  const maxCount = Math.max(...Object.values(choiceCount))
  const alignmentScore = Math.round((maxCount / session.players.length) * 100)

  let comment = alignmentScore >= 80 ? 'Wow! You\'re practically sharing a brain!' : alignmentScore >= 50 ? 'Pretty aligned with a sprinkle of variety!' : 'A beautiful chaos of opinions!'

  if (apiKey){
    try{
      const resultsText = Object.entries(breakdown).map(([c, count]) => `${count} chose ${c}`).join(', ')
      const prompt = `Question was: "${question}". Results: ${resultsText}. Alignment: ${alignmentScore}%. Write a witty, fun 1-sentence comment about this result. Celebrate both alignment and diversity.`

      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.95,
        max_tokens: 100
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3017',
          'X-Title': 'The Alignment Game'
        }
      })

      comment = (response.data.choices[0]?.message?.content || '').trim() || comment
      comment = comment.replace(/^["'\s]+/, '').replace(/["'\s]+$/, '')
    }catch(err){
      console.error('OpenRouter submit error:', err.response?.data || err.message)
    }
  }

  session.rounds.push({ round, question, choices, playerChoices, alignmentScore, breakdown, comment })

  return res.status(200).json({ alignmentScore, comment, breakdown, session })
}

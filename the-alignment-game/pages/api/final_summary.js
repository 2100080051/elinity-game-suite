import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' })
  const { session, roundScores } = req.body

  const systemPromptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  const systemPrompt = fs.existsSync(systemPromptPath) ? fs.readFileSync(systemPromptPath, 'utf-8') : ''

  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo'

  const avgScore = Math.round(roundScores.reduce((a,b)=>a+b,0) / roundScores.length)
  let verdict = avgScore >= 80 ? 'Cosmic Harmony! 🌟' : avgScore >= 60 ? 'Mostly in Sync 🎶' : avgScore >= 40 ? 'Beautifully Diverse 🌈' : 'Chaos Energy! 🎉'
  let summary = `Your group is ${avgScore}% aligned across ${roundScores.length} rounds. That's a beautiful mix of harmony and individuality!`

  if (apiKey){
    try{
      const prompt = `The Alignment Game finished with ${roundScores.length} rounds. Average alignment: ${avgScore}%. Scores: ${roundScores.join(', ')}. Write a fun, witty final verdict (1 sentence) and a light summary (2 sentences) celebrating the group's alignment style.`

      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 180
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3017',
          'X-Title': 'The Alignment Game'
        }
      })

      const text = (response.data.choices[0]?.message?.content || '').trim()
      const lines = text.split('\n').filter(Boolean)
      if (lines.length >= 1) verdict = lines[0].trim()
      if (lines.length >= 2) summary = lines.slice(1).join(' ').trim()
    }catch(err){
      console.error('OpenRouter final error:', err.response?.data || err.message)
    }
  }

  return res.status(200).json({ overallScore: avgScore, verdict, summary })
}

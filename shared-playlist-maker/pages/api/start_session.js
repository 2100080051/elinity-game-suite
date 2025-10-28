import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' })
  const { theme } = req.body
  if (!theme) return res.status(400).json({ error:'Theme required' })

  const systemPromptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  const systemPrompt = fs.existsSync(systemPromptPath) ? fs.readFileSync(systemPromptPath, 'utf-8') : ''

  const groqApiKey = process.env.GROQ_API_KEY
  const groqModel = process.env.GROQ_MODEL || 'groq/compound'

  const session = {
    theme,
    tracks: [],
    started_at: new Date().toISOString(),
    systemPrompt
  }

  let greeting = `Welcome to the Shared Playlist Maker. Let's build a soundtrack for "${theme}". Add your tracks below, and I'll weave them into one cohesive vibe.`

  if (groqApiKey){
    try{
      const prompt = `You are the Vibe Conductor for a playlist titled "${theme}". Write a warm, musical greeting (2-3 sentences) inviting players to contribute songs. Keep it artistic and poetic.`
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: groqModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.85,
        max_tokens: 120
      }, { headers: { Authorization: `Bearer ${groqApiKey}`, 'Content-Type':'application/json' }})
      greeting = (response.data.choices[0]?.message?.content || '').trim() || greeting
    }catch(err){
      console.error('Groq start error:', err.response?.data || err.message)
    }
  }

  return res.status(200).json({ greeting, session })
}

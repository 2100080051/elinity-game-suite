import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' })
  const { session, track } = req.body
  if (!session || !track) return res.status(400).json({ error:'Missing data' })

  const systemPromptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  const systemPrompt = fs.existsSync(systemPromptPath) ? fs.readFileSync(systemPromptPath, 'utf-8') : ''

  const groqApiKey = process.env.GROQ_API_KEY
  const groqModel = process.env.GROQ_MODEL || 'groq/compound'

  let comment = `That track adds a really cool layer to the vibe.`

  if (groqApiKey){
    try{
      const prompt = `Playlist theme: "${session.theme}". ${track.player} just added "${track.title}" by ${track.artist}. Write a brief (1 sentence) comment on how this song fits the vibe. Use musical imagery and be warm.`
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: groqModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 80
      }, { headers: { Authorization: `Bearer ${groqApiKey}`, 'Content-Type':'application/json' }})
      comment = (response.data.choices[0]?.message?.content || '').trim() || comment
      comment = comment.replace(/^["'\s]+/, '').replace(/["'\s]+$/, '')
    }catch(err){
      console.error('Groq track comment error:', err.response?.data || err.message)
    }
  }

  session.tracks.push({ ...track, comment })

  return res.status(200).json({ comment, session })
}

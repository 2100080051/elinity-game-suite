import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' })
  const { session, playlist } = req.body
  if (!session || !playlist) return res.status(400).json({ error:'Missing data' })

  const systemPromptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  const systemPrompt = fs.existsSync(systemPromptPath) ? fs.readFileSync(systemPromptPath, 'utf-8') : ''

  const groqApiKey = process.env.GROQ_API_KEY
  const groqModel = process.env.GROQ_MODEL || 'groq/compound'

  let playlistTitle = `${session.theme} — The Soundtrack`
  let moodDescription = 'A beautifully curated blend of emotion and energy, captured in sound.'
  let artworkDescription = 'Soft gradients of purple and teal, with neon lights reflecting on rain-soaked streets.'
  let summary = 'This playlist feels like a late-night journey through memories and dreams.'

  if (groqApiKey && playlist.length){
    try{
      const trackList = playlist.map(t => `"${t.title}" by ${t.artist}`).join(', ')
      const prompt = `Create a final playlist package for theme "${session.theme}" with these ${playlist.length} tracks: ${trackList}.

Output in this format:
TITLE: [creative playlist name]
MOOD: [1 short poetic paragraph describing the emotional arc]
ARTWORK: [visual description for AI-generated album art, 1-2 sentences]
SUMMARY: [1 sentence starting with "This playlist feels like..."]`

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: groqModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 350
      }, { headers: { Authorization: `Bearer ${groqApiKey}`, 'Content-Type':'application/json' }})

      const text = (response.data.choices[0]?.message?.content || '').trim()
      const titleMatch = text.match(/TITLE:\s*(.+)/i)
      const moodMatch = text.match(/MOOD:\s*(.+?)(?=ARTWORK:|SUMMARY:|$)/is)
      const artworkMatch = text.match(/ARTWORK:\s*(.+?)(?=SUMMARY:|$)/is)
      const summaryMatch = text.match(/SUMMARY:\s*(.+)/is)

      if (titleMatch) playlistTitle = titleMatch[1].trim()
      if (moodMatch) moodDescription = moodMatch[1].trim()
      if (artworkMatch) artworkDescription = artworkMatch[1].trim()
      if (summaryMatch) summary = summaryMatch[1].trim()
    }catch(err){
      console.error('Groq generate error:', err.response?.data || err.message)
    }
  }

  return res.status(200).json({ playlistTitle, moodDescription, artworkDescription, summary })
}

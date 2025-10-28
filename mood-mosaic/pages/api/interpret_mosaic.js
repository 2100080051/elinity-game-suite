import fs from 'fs'
import path from 'path'
import axios from 'axios'

function getModelCandidates(){
  return process.env.GROQ_MODEL 
    ? [process.env.GROQ_MODEL, 'groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
    : ['groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
}

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'POST only'})
  
  const {theme, mosaic, filled_count, total_slots} = req.body
  if(!theme || !mosaic || !Array.isArray(mosaic)){
    return res.status(400).json({error:'theme and mosaic array required'})
  }

  const systemPrompt = fs.readFileSync(path.join(process.cwd(), 'public', 'system_prompt.txt'), 'utf8')
  
  const apiKey = process.env.GROQ_API_KEY
  if(!apiKey){
    // Mock mode
    return res.json({
      mood_description: `Your ${theme} mosaic radiates creativity and vision! The images you've chosen reveal a balanced aesthetic.`,
      dominant_themes: ['Visual Harmony', 'Creative Expression', 'Collaborative Spirit'],
      emotional_reflection: 'This board suggests a group in tune with beauty and meaning.',
      story_suggestion: 'There\'s a narrative of exploration and discovery woven through your choices.',
      replay_suggestions: ['Try a contrasting theme', 'Remix with surreal elements', 'Create a seasonal variant']
    })
  }

  const models = getModelCandidates()
  let interpretation = null

  const prompt = `Analyze this completed mood mosaic:

Theme: ${theme}
Images placed: ${filled_count} out of ${total_slots}

Your task:
1. Describe the overall mood/vibe (2-3 sentences, warm and insightful)
2. Identify 3-5 dominant themes or patterns
3. Offer emotional/psychological reflection (2 sentences)
4. Suggest a story or narrative that emerges (2 sentences)
5. Provide 3 replay suggestions (e.g., "Try a darker theme", "Explore abstract emotions")

Return ONLY a JSON object with fields:
{
  "mood_description": "string",
  "dominant_themes": ["string", ...],
  "emotional_reflection": "string",
  "story_suggestion": "string",
  "replay_suggestions": ["string", ...]
}

No extra text outside the JSON.`

  for(const model of models){
    try{
      const apiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: prompt}
        ],
        temperature: 0.85,
        max_tokens: 800
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 25000
      })
      const text = apiRes.data.choices[0].message.content.trim()
      const match = text.match(/\{[\s\S]*\}/)
      if(match){
        interpretation = JSON.parse(match[0])
        break
      }
    }catch(err){
      console.error(`Model ${model} failed:`, err.response?.data || err.message)
    }
  }

  // Fallback if all models fail
  if(!interpretation){
    interpretation = {
      mood_description: `Your ${theme} mosaic radiates creativity and intention! Each image contributes to a cohesive visual story that feels both personal and universal.`,
      dominant_themes: ['Visual Harmony', 'Thematic Coherence', 'Emotional Depth', 'Creative Collaboration'],
      emotional_reflection: 'The choices reveal a group seeking balance between structure and spontaneity, comfort and adventure.',
      story_suggestion: 'A narrative of exploration emerges—curious minds navigating between the familiar and the unknown, building meaning together.',
      replay_suggestions: ['Explore a contrasting theme (dark vs light)', 'Try a surreal or abstract remix', 'Create a seasonal or time-based variant']
    }
  }

  return res.json(interpretation)
}

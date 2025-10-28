import fs from 'fs'
import path from 'path'
import axios from 'axios'

function getModelCandidates(){
  return process.env.GROQ_MODEL 
    ? [process.env.GROQ_MODEL, 'groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
    : ['groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
}

// Generate placeholder image URLs based on theme
function generateImageUrls(theme, count = 20){
  const keywords = {
    'Fantasy & Magic': ['dragon', 'castle', 'wizard', 'fairy', 'crystal', 'enchanted', 'mystical', 'spell', 'potion', 'unicorn'],
    'Dreams & Surrealism': ['dream', 'surreal', 'abstract', 'floating', 'ethereal', 'cosmic', 'mirror', 'illusion', 'time', 'portal'],
    'Nostalgia & Memories': ['vintage', 'retro', 'old-photo', 'childhood', 'sepia', 'antique', 'memory', 'nostalgia', 'past', 'classic'],
    'Sci-Fi & Future': ['future', 'robot', 'space', 'cyberpunk', 'neon', 'tech', 'hologram', 'alien', 'spacecraft', 'cyborg'],
    'Nature & Wilderness': ['forest', 'mountain', 'ocean', 'sunset', 'wildlife', 'flowers', 'waterfall', 'desert', 'aurora', 'meadow'],
    'Urban & City Life': ['city', 'street', 'architecture', 'urban', 'skyline', 'cafe', 'metro', 'graffiti', 'lights', 'downtown'],
    'Emotions & Abstract': ['joy', 'sadness', 'anger', 'peace', 'chaos', 'love', 'fear', 'hope', 'passion', 'calm']
  }

  const themWords = keywords[theme] || ['creative', 'artistic', 'colorful', 'vibrant', 'mood', 'aesthetic', 'visual', 'design', 'art', 'beauty']
  const images = []
  
  for(let i = 0; i < count; i++){
    const word = themWords[i % themWords.length]
    const seed = Math.floor(Math.random() * 1000)
    // Using Picsum Photos with blur for abstract artistic effect
    images.push(`https://picsum.photos/seed/${word}${seed}/400/400?blur=1`)
  }
  
  return images
}

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'POST only'})
  
  const {theme, regenerate} = req.body
  if(!theme) return res.status(400).json({error:'theme required'})

  const systemPrompt = fs.readFileSync(path.join(process.cwd(), 'public', 'system_prompt.txt'), 'utf8')
  
  // Generate 20 image URLs based on theme
  const images = generateImageUrls(theme, 20)

  const apiKey = process.env.GROQ_API_KEY
  if(!apiKey){
    // Mock mode - return images directly
    return res.json({images, theme})
  }

  // Optional: Get AI commentary on theme
  const models = getModelCandidates()
  let commentary = ''

  for(const model of models){
    try{
      const apiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: `Players chose theme: "${theme}". Give them a brief, playful welcome (1 sentence) as they start building their mosaic.`}
        ],
        temperature: 0.8,
        max_tokens: 100
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      })
      commentary = apiRes.data.choices[0].message.content.trim()
      break
    }catch(err){
      console.error(`Model ${model} failed:`, err.response?.data || err.message)
    }
  }

  return res.json({images, theme, commentary})
}

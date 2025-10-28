import fs from 'fs'
import path from 'path'
import axios from 'axios'

function getModelCandidates(){
  return process.env.GROQ_MODEL 
    ? [process.env.GROQ_MODEL, 'groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
    : ['groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
}

const absurdTopics = [
  "Should sandwiches be legally classified as tacos?",
  "Are hot dogs actually sandwiches?",
  "Would cats make better world leaders than dogs?",
  "Is cereal technically a soup?",
  "Should pineapple on pizza be banned internationally?",
  "Are stairs just indoor mountains?",
  "Is a thumb technically a finger?",
  "Should everyone be required to wear capes on Fridays?",
  "Are ghosts just dead Wi-Fi signals?",
  "Is water wet or does it make things wet?",
  "Should we normalize wearing pajamas to formal events?",
  "Are birds actually government surveillance drones?",
  "Is ketchup a valid smoothie ingredient?",
  "Should we replace handshakes with synchronized dance moves?",
  "Are mushrooms closer to aliens than vegetables?",
  "Is time a construct created by clock companies to sell more clocks?",
  "Should humans have tails for better balance?",
  "Are video game skills a valid form of exercise?",
  "Should we communicate exclusively through memes?",
  "Is outer space just the ocean but upside down?"
]

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'POST only'})
  
  const systemPrompt = fs.readFileSync(path.join(process.cwd(), 'public', 'system_prompt.txt'), 'utf8')
  
  const apiKey = process.env.GROQ_API_KEY
  if(!apiKey){
    // Mock mode - return random topic
    const randomTopic = absurdTopics[Math.floor(Math.random() * absurdTopics.length)]
    return res.json({topic: randomTopic})
  }

  const models = getModelCandidates()
  let topic = null

  for(const model of models){
    try{
      const apiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: 'Generate one absurd, funny, or thought-provoking debate topic (e.g., "Should sandwiches be classified as tacos?"). Return ONLY the topic as a question, no extra text.'}
        ],
        temperature: 1.0,
        max_tokens: 100
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      })
      topic = apiRes.data.choices[0].message.content.trim()
      // Remove quotes if present
      topic = topic.replace(/^["']|["']$/g, '')
      break
    }catch(err){
      console.error(`Model ${model} failed:`, err.response?.data || err.message)
    }
  }

  // Fallback if all models fail
  if(!topic){
    topic = absurdTopics[Math.floor(Math.random() * absurdTopics.length)]
  }

  return res.json({topic})
}

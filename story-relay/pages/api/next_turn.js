import fs from 'fs'
import path from 'path'
import axios from 'axios'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
// Allow override via env and provide safe fallbacks to try
const DEFAULT_FALLBACK_MODELS = ['gpt-4o-mini', 'gpt-3o-mini']

function getModelCandidates(){
  const envModel = process.env.GROQ_MODEL
  const list = []
  if (envModel) list.push(envModel)
  // then try a couple of broadly-named fallbacks
  for (const m of DEFAULT_FALLBACK_MODELS) if (!list.includes(m)) list.push(m)
  return list
}

function loadSystemPrompt(){
  try{
    const p = path.join(process.cwd(), 'public', 'system_prompt.txt')
    return fs.readFileSync(p, 'utf-8')
  }catch(e){
    return 'You are ElinityAI, the Game Master for Story Relay.'
  }
}

function mockTwist(){
  const twists = [
    'A sudden thunderstorm reveals the moon is a giant clockwork.',
    "Everyone's shadows start acting on their own, leading to a hidden door.",
    'The protagonist discovers they can hear plants whispering secrets.',
    'A forgotten postcard arrives announcing that the city will float tomorrow.',
    'A singing cat declares itself monarch and demands tea for everyone.'
  ]
  return twists[Math.floor(Math.random()*twists.length)]
}

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { player, line, story, turn_number } = req.body
  if (!player || !line) return res.status(400).json({ error: 'player and line required' })

  const updated = Array.isArray(story) ? [...story] : []
  updated.push({ player, line })

  let twistInserted = false
  if (turn_number === 2 || (turn_number >= 3 && turn_number % 3 === 0)){
    // prepare prompt
    const systemPrompt = loadSystemPrompt()
    const userPromptLines = ['Insert a short, surprising twist into the story so far. Respond as a single line, and label the speaker as ElinityAI.','\nCurrent story lines:']
    for (const e of updated) userPromptLines.push(`- ${e.player}: ${e.line}`)
    const userPrompt = userPromptLines.join('\n')

    const GROQ_API_KEY = process.env.GROQ_API_KEY
    if (!GROQ_API_KEY){
      const twist = mockTwist()
      updated.push({ player: 'ElinityAI', line: twist })
      twistInserted = true
    }else{
      // try models in order until one works
      const models = getModelCandidates()
      let success = false
      for (const model of models){
        try{
          const payload = {
            model,
            messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt } ],
            max_tokens: 150,
            temperature: 0.9,
          }
          const resp = await axios.post(GROQ_URL, payload, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` }, timeout: 30000 })
          const content = resp.data?.choices?.[0]?.message?.content || JSON.stringify(resp.data)
          let twistText = content.toString().split('\n')[0].trim()
          if (twistText.toLowerCase().startsWith('elinityai:')) twistText = twistText.split(':').slice(1).join(':').trim()
          updated.push({ player: 'ElinityAI', line: twistText })
          twistInserted = true
          success = true
          break
        }catch(e){
          const err = e?.response?.data || e.message
          console.error(`Groq call error for model=${model}`, err)
          // if it's a model_not_found, try next candidate; otherwise break and fallback
          const code = e?.response?.data?.code || e?.response?.data?.error?.code
          if (code === 'model_not_found'){
            continue
          }else{
            // other error (rate limit, auth) -> stop trying further
            break
          }
        }
      }
      if (!success){
        // fallback to mock
        updated.push({ player: 'ElinityAI', line: mockTwist() })
        twistInserted = true
      }
    }
  }

  return res.status(200).json({ story: updated, twist_inserted: twistInserted })
}

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
  
  const {topic, arguments: debateArgs, player1, player2} = req.body
  if(!topic || !debateArgs || !player1 || !player2){
    return res.status(400).json({error:'topic, arguments, and players required'})
  }

  const systemPrompt = fs.readFileSync(path.join(process.cwd(), 'public', 'system_prompt.txt'), 'utf8')
  
  const apiKey = process.env.GROQ_API_KEY
  if(!apiKey){
    // Mock mode
    const winner = Math.random() > 0.5 ? player1 : player2
    return res.json({
      winner_name: winner.name,
      winner_side: winner.side,
      summary: `What a debate! Both sides brought passion, creativity, and just the right amount of chaos.`,
      reasoning: `${winner.name} wins because their argument was 30% logic, 70% sass, and 100% entertaining!`,
      next_topic: 'Should we replace all currency with cheese?'
    })
  }

  const models = getModelCandidates()
  let result = null

  const argsSummary = debateArgs.map(arg => `${arg.player} (${arg.side}): ${arg.text}`).join('\n')
  const prompt = `Topic: ${topic}

All arguments:
${argsSummary}

Players:
- ${player1.name} argued ${player1.side}
- ${player2.name} argued ${player2.side}

Declare a winner with:
1. A humorous summary of the debate (2 sentences)
2. Which player won and why (use creative, entertaining reasoning - not just logic)
3. Suggest a new absurd debate topic

Return ONLY a JSON object with:
{
  "winner_name": "string",
  "winner_side": "for" or "against",
  "summary": "string",
  "reasoning": "string",
  "next_topic": "string"
}

No extra text.`

  for(const model of models){
    try{
      const apiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: prompt}
        ],
        temperature: 0.9,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      })
      const text = apiRes.data.choices[0].message.content.trim()
      const match = text.match(/\{[\s\S]*\}/)
      if(match){
        result = JSON.parse(match[0])
        break
      }
    }catch(err){
      console.error(`Model ${model} failed:`, err.response?.data || err.message)
    }
  }

  // Fallback
  if(!result){
    const winner = Math.random() > 0.5 ? player1 : player2
    result = {
      winner_name: winner.name,
      winner_side: winner.side,
      summary: `This debate had everything: passion, creativity, and questionable logic. What a ride!`,
      reasoning: `${winner.name} takes the crown with an argument that was equal parts brilliant and absurd. The perfect combo!`,
      next_topic: 'Is breakfast cereal technically a salad?'
    }
  }

  return res.json(result)
}

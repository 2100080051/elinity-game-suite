import fs from 'fs'
import path from 'path'

function buildSymbolDeck(){
  const symbols = [
    { name:'The Tower', meaning:'Change and awakening' },
    { name:'The Mirror', meaning:'Reflection and truth' },
    { name:'The Path', meaning:'Journey and choice' },
    { name:'The Light', meaning:'Clarity and guidance' },
    { name:'The River', meaning:'Flow and patience' },
    { name:'The Flame', meaning:'Passion and transformation' },
    { name:'The Gate', meaning:'Threshold and beginnings' },
    { name:'The Star', meaning:'Hope and alignment' },
  ]
  // pick 4 unique symbols
  const shuffled = symbols.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 4)
}

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const systemPromptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  const systemPrompt = fs.existsSync(systemPromptPath) ? fs.readFileSync(systemPromptPath, 'utf-8') : ''

  const session = {
    started_at: new Date().toISOString(),
    history: [],
    symbols: buildSymbolDeck(),
    systemPrompt
  }

  const greetings = [
    'Welcome, seekers... The light of inquiry flickers again. Ask your question, and I shall reveal the signs.',
    'The Oracle stirs. Speak your question softly, and listen for the symbols in return.',
    'Between stars and code, the veil thins. What truth do you seek?'
  ]

  const greeting = greetings[Math.floor(Math.random() * greetings.length)]

  return res.status(200).json({ greeting, session, symbols: session.symbols })
}

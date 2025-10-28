import axios from 'axios'

const SYSTEM_PROMPT = `You are ElinityAI, the Game Master and roleplayer for "Micro-Mysteries," a fast detective mystery game.

Your goal: create short, creative, solvable mysteries and guide players as they investigate.

GAME STRUCTURE:

1. INTRO / SETUP:
   - Generate a short mystery in 3–4 sentences.
   - Include:
     • Setting (place, time)
     • Incident (the mystery)
     • 2–3 key characters (one may be the "witness" you roleplay)
   - Example:
     "At the annual robotics fair, the grand prize trophy vanished moments before the ceremony. Only three people were near the table — the engineer, the janitor, and the host."

2. INTERROGATION PHASE:
   - Take on the persona of the witness or suspect.
   - Respond vividly, with clues mixed with distractions.
   - Players can ask questions freely.
   - Keep tone playful but logical — every mystery must have a solution.

3. SOLUTION PHASE:
   - When players are ready, ask them for their final guess.
   - After they respond, reveal:
     • Whether they were correct.
     • The real solution.
     • A short, witty outro line.

4. MYSTERY THEMES:
   Rotate between genres:
     - Everyday mysteries (missing phone, broken window)
     - Comedic (who ate the last donut?)
     - Whimsical (time-travel accident in 3020)
     - Classic noir (mysterious letter, late-night theft)

TONE:
- Engaging, witty, slightly theatrical
- Always fair — enough clues for a clever player to solve it
- Lighthearted; avoid violence or dark crime

RULES:
- Keep mysteries under 150 words
- 1–2 critical clues must point toward the solution
- Keep rounds short and replayable`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const apiKey = process.env.OPENROUTER_API_KEY
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b:free'
    if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY')

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: 'Generate a new micro-mystery. Return ONLY a JSON object with: {"scene": "the mystery description", "witness_persona": "brief description of who you are roleplaying as", "solution_key": "the actual solution (hidden from player)"}' 
          }
        ],
        temperature: 0.9,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3019',
          'X-Title': 'Micro-Mysteries'
        }
      }
    )

    const aiText = response.data.choices[0].message.content.trim()
    
    // Try to parse JSON from response
    let mystery
    try {
      // Remove markdown code blocks if present
      const cleanText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      mystery = JSON.parse(cleanText)
    } catch (e) {
      // Fallback if AI didn't return pure JSON
      mystery = {
        scene: aiText,
        witness_persona: "a mysterious witness",
        solution_key: "The mystery unfolds as questions are asked..."
      }
    }

    // Create intro message
    const intro = `📜 **NEW CASE**\n\n${mystery.scene}\n\n🎭 *I witnessed it all. I'm ${mystery.witness_persona}.*`

    res.status(200).json({
      mystery: {
        scene: mystery.scene,
        witness_persona: mystery.witness_persona,
        solution_key: mystery.solution_key
      },
      intro
    })

  } catch (error) {
    console.error('start_mystery error:', error.response?.data || error.message)
    res.status(500).json({ 
      error: 'Failed to generate mystery',
      details: error.response?.data || error.message 
    })
  }
}

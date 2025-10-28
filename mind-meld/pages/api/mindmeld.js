export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { OPENROUTER_API_KEY, OPENROUTER_MODEL, NEXT_PUBLIC_APP_URL, DEBUG_MINDMELD } = process.env;
  if (!OPENROUTER_API_KEY || !OPENROUTER_MODEL) return res.status(500).json({ error: 'Missing OpenRouter configuration' });

  const { action, players, category, aGuess, bGuess, rounds, score } = req.body || {};

  const systemPrompt = `You are ElinityAI, the witty, upbeat host of “Mind Meld,” a game of thought alignment.\n\nYour job:\n- Give players categories.\n- Collect their guesses (what they think the other player will choose).\n- Reveal matches.\n- Track and summarize scores with fun commentary.\n\nGAME STRUCTURE:\n1. INTRO: Welcome and explain rules.\n2. ROUND LOOP: Provide category from varied mix.\n3. PLAYER INPUT: Wait for both guesses.\n4. SCORING: If exact match → +1. If close, partial credit (0.5). Provide playful commentary.\n5. REPEAT OR END: Summarize with a final tagline.\n\nTONE:\n- Fun, casual, game-show host style\n- Add humor between rounds\n- Avoid sarcasm or negativity`;

  function normalize(s) { return String(s||'').trim().toLowerCase(); }

  const buildUser = () => {
    if (action === 'category') {
      return `Provide ONE short category as a string (2–5 words), varied from: Food, Movies, Music, Colors, Animals, Emotions, Travel, Activities, Superpowers, Morning Routines.\nRespond ONLY as JSON with key: category.`;
    }
    if (action === 'judge') {
      return `Category: ${category}.\nPlayer A guessed for B: ${aGuess}\nPlayer B guessed for A: ${bGuess}\nJudge whether these two guesses MATCH (same or nearly same concept). Consider synonyms and very close alternatives within the category.\nRespond ONLY as JSON with keys: match (boolean), partial (boolean), reaction (string, playful) and optionally normalized (object with a and b). If match true → points=1. If partial true (close but not same) → points=0.5. If neither, points=0.`;
    }
    if (action === 'summary') {
      return `Provide an upbeat closing summary for Mind Meld with total score ${score} over ${rounds} rounds.\nRespond ONLY as JSON with keys: title (string), summary (2–4 playful lines).`;
    }
    return 'Unsupported action';
  };

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: buildUser() },
  ];

  const payload = {
    model: OPENROUTER_MODEL,
    messages,
    temperature: 0.9,
    response_format: { type: 'json_object' },
  };

  try {
    if (action === 'judge') {
      // quick local baseline: exact match → points=1
      const nA = normalize(aGuess); const nB = normalize(bGuess);
      if (nA && nA === nB) {
        return res.status(200).json({ match: true, partial: false, points: 1, reaction: 'Perfect sync! You two are telepathic! 🧠✨' });
      }
    }

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': NEXT_PUBLIC_APP_URL || 'http://localhost:3025',
        'X-Title': 'Mind Meld',
      },
      body: JSON.stringify(payload),
    });

    const raw = await r.json();
    const text = raw?.choices?.[0]?.message?.content || '';

    const cleaned = String(text).replace(/^```json\n?|```$/g, '').trim();
    let data = null; try { data = JSON.parse(cleaned); } catch(e) { const m = cleaned.match(/\{[\s\S]*\}/); if (m) { try { data = JSON.parse(m[0]); } catch(_) {} } }

    // fallbacks
    if (!data || typeof data !== 'object') {
      if (action === 'category') data = { category: 'Favorite Dessert 🍰' };
      else if (action === 'judge') data = { match: false, partial: false, points: 0, reaction: 'Not quite a mind meld this time — still fun!' };
      else if (action === 'summary') data = { title: 'Mind Meld Summary', summary: `Your total Mind Sync Score: ${score}/${rounds}. Great vibes and good guesses!` };
    }

    if (action === 'judge') {
      // ensure points
      if (data.match) data.points = 1;
      else if (data.partial && !data.points) data.points = 0.5;
      else data.points = 0;
    }

    if (DEBUG_MINDMELD) console.log('[mindmeld.debug]', { action, text, data });
    return res.status(200).json(data);
  } catch (err) {
    console.error('OpenRouter error', err);
    if (action === 'category') return res.status(200).json({ category: 'Favorite Dessert 🍰' });
    if (action === 'judge') return res.status(200).json({ match: false, partial: false, points: 0, reaction: 'Not quite a mind meld this time — still fun!' });
    if (action === 'summary') return res.status(200).json({ title: 'Mind Meld Summary', summary: `Your total Mind Sync Score: ${score}/${rounds}. Great vibes and good guesses!` });
    return res.status(500).json({ error: 'AI service error' });
  }
}

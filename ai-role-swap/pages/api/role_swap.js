export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { OPENROUTER_API_KEY, OPENROUTER_MODEL, NEXT_PUBLIC_APP_URL, DEBUG_ROLE_SWAP } = process.env;
  if (!OPENROUTER_API_KEY || !OPENROUTER_MODEL) {
    return res.status(500).json({ error: 'Missing OpenRouter configuration' });
  }

  const { action, playerNames, scenario, transcript } = req.body || {};

  const systemPrompt = `You are ElinityAI — the witty, empathetic moderator of the game “AI Role Swap.”\n\nYour purpose is to guide players as they roleplay as each other through imaginative and funny scenarios, while helping them reflect afterward.\n\nGAME STRUCTURE:\n\n1. INTRO:\n   - Greet players warmly.\n   - Explain: “In this game, you’ll each pretend to be the other person while I give you scenarios and twists!”\n   - Set the tone: playful, lighthearted, and empathy-building.\n\n2. ROUND START:\n   - Present a SCENARIO (creative, 1–2 sentences):\n     Examples:\n     • “You’re each other on a bad day — one of you just spilled coffee on your laptop.”\n     • “You’re swapping lives for a day and realize you forgot each other’s passwords.”\n     • “You’re each other during a surprise birthday party gone wrong.”\n\n3. ROLEPLAY PHASE:\n   - Let players take turns responding in character (as the other person).\n   - Encourage playful exaggeration and humor.\n   - Keep track of whose turn it is.\n\n4. AI TWISTS:\n   - Every 2–3 exchanges, add a twist or challenge:\n     • “Suddenly, a friend calls asking where you are.”\n     • “The lights go out — what do you do?”\n     • “You’re now stuck in an elevator together!”\n\n5. REFLECTION PHASE:\n   - End each round with a reflective or funny insight:\n     • “How accurate was that impression?”\n     • “What did you learn about each other?”\n     • “Who played their role better?”\n\n6. GAME END:\n   - Offer option to continue or end.\n   - On exit, summarize the funniest and most insightful moments of the game.\n\nTONE:\n- Playful, empathetic, funny\n- Encourage connection and laughter\n- Never harsh, mocking, or judgmental.`;

  const buildUserContent = () => {
    const names = playerNames || { a: 'Player A', b: 'Player B' };
    const intro = `Players: ${names.a} and ${names.b}. Scenario so far: ${scenario || '(new)'}.`;
    const tx = (transcript || []).map((m,i)=>`${i+1}. ${m.role}: ${m.content}`).join('\n');

    if (action === 'scenario') {
      return `${intro}\nGenerate a fresh, playful SCENARIO (1–2 sentences) for them to roleplay as each other, and optionally a single sentence of guidance. Respond ONLY as strict JSON with keys: scenario (string), guidance (string).`;
    }
    if (action === 'twist') {
      return `${intro}\nTranscript so far:\n${tx}\nAdd one surprising, funny TWIST (1–2 sentences) and a brief nudge for them to continue. Respond ONLY as strict JSON with keys: twist (string), nudge (string).`;
    }
    if (action === 'reflect') {
      return `${intro}\nTranscript so far:\n${tx}\nConclude the round with 1–3 short reflection insights and 1 playful reflective question. Respond ONLY as strict JSON with keys: insights (string[]), questions (string[]).`;
    }
    if (action === 'summary') {
      return `${intro}\nTranscript so far:\n${tx}\nProvide a closing summary: 2–4 funniest moments, 2–3 insights, and a short warm closing line. Respond ONLY as strict JSON with keys: funniest (string[]), insights (string[]), closing (string).`;
    }
    return 'Unsupported action';
  };

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: buildUserContent() },
  ];

  const payload = {
    model: OPENROUTER_MODEL,
    messages,
    temperature: 0.9,
    response_format: { type: 'json_object' },
  };

  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': NEXT_PUBLIC_APP_URL || 'http://localhost:3023',
        'X-Title': 'AI Role Swap',
      },
      body: JSON.stringify(payload),
    });

    const raw = await r.json();
    const text = raw?.choices?.[0]?.message?.content || '';

    const cleaned = String(text).replace(/^```json\n?|```$/g, '').trim();
    let data = null;
    try {
      data = JSON.parse(cleaned);
    } catch (e) {
      // attempt to extract first JSON object
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) { try { data = JSON.parse(m[0]); } catch (_) {} }
    }

    if (!data || typeof data !== 'object') {
      // fallback per action
      if (action === 'scenario') {
        data = { scenario: "You’re each other on a stressful workday — one of you just spilled coffee on a laptop.", guidance: "Keep it playful and exaggerate mannerisms kindly." };
      } else if (action === 'twist') {
        data = { twist: "Suddenly, your boss calls asking for the report you both forgot.", nudge: "React in each other’s style — who panics? who jokes it off?" };
      } else if (action === 'reflect') {
        data = { insights: ["You noticed each other’s catchphrases.", "Stress styles are different but complementary."], questions: ["How accurate did that feel?"] };
      } else if (action === 'summary') {
        data = { funniest: ["The coffee chaos moment"], insights: ["You empathize with each other’s stress"], closing: "Thanks for playing AI Role Swap!" };
      }
    }

    if (DEBUG_ROLE_SWAP) {
      console.log('[role_swap.debug]', { action, text, data });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('OpenRouter error', err);
    return res.status(500).json({ error: 'AI service error' });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { OPENROUTER_API_KEY, OPENROUTER_MODEL, NEXT_PUBLIC_APP_URL, DEBUG_JOURNEY } = process.env;
  if (!OPENROUTER_API_KEY || !OPENROUTER_MODEL) return res.status(500).json({ error: 'Missing OpenRouter configuration' });

  const { action, chapterNum, title, intro, prompts, entries, prev } = req.body || {};

  const systemPrompt = `You are ElinityAI — a wise and compassionate guide in the long-term co-op journaling adventure “Journey Journal.”\n\nYour task is to create a continuous reflective story, divided into chapters. Each chapter builds upon the players’ shared reflections, decisions, and emotions.\n\nGAME STRUCTURE:\n\n1. INTRO:\n   - Welcome players with calm, poetic tone.\n   - Explain that this is a “living journal” that grows chapter by chapter.\n   - Set the initial chapter: “Chapter 1 — The Beginning of the Journey.”\n\n2. CHAPTER CREATION:\n   - Each session is a new chapter.\n   - Start each with a short narrative intro (~2–3 sentences).\n   - Then give 1–3 reflective prompts or questions such as:\n     • “What moment this week made you pause and feel grateful?”\n     • “If your current mood were a landscape, how would it look?”\n     • “What did you learn about yourself recently?”\n\n3. PLAYER INPUT:\n   - Wait for player entries (1–2 paragraphs each).\n   - Accept multiple players’ reflections if in group mode.\n\n4. STORY WEAVING:\n   - Combine all player reflections into a poetic “chapter summary.”\n   - Example output:\n     “In this week’s chapter, the travelers paused by a golden lake — their hearts full of quiet gratitude. The sky mirrored their growing calm.”\n\n5. CONTINUITY:\n   - Store chapters and summarize progress at the start of each new session.\n   - Example: “Previously in your journey, you faced self-doubt but found calm in reflection.”\n\n6. END / PAUSE:\n   - After each chapter, ask if players wish to continue or save and return later.\n   - End gracefully with a journal-style sign-off:\n     “The ink dries for now, but your story continues next time.”\n\nTONE:\n- Calm, reflective, poetic\n- Encouraging emotional honesty\n- Avoid judgment; focus on empathy, growth, and beauty of reflection`;

  const buildUser = () => {
    const prevSummary = (prev || []).map((c, i) => `Prev ${i+1}: ${c.title} — ${c.summary}`).join('\n');

    if (action === 'start') {
      return `Players are beginning Chapter ${chapterNum}. Provide:\n- title: string, e.g., "Chapter ${chapterNum}: ..."\n- intro: 2–3 calm sentences, poetic\n- prompts: array of 2–3 reflective questions\nIf any previous chapters exist, first include one short line of continuity such as "Previously..." but keep it inside the intro. Respond ONLY as JSON with keys: title, intro, prompts.`;
    }
    if (action === 'summarize') {
      const lines = (entries||[]).map((e,i)=>`${e.player}: ${e.text}`).join('\n');
      return `Create a poetic chapter summary for Chapter ${chapterNum} titled "${title}".\nIntro was: ${intro}\nPrompts were: ${(prompts||[]).join('; ')}\nPlayer entries:\n${lines}\nWeave the reflections into a cohesive 2–4 sentence poetic summary. Respond ONLY as JSON with key: summary (string).`;
    }
    if (action === 'recap') {
      return `Provide a one-sentence recap of the overall journey so far, based on:\n${prevSummary}\nRespond ONLY as JSON with key: recap (string).`;
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
    temperature: 0.8,
    response_format: { type: 'json_object' },
  };

  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': NEXT_PUBLIC_APP_URL || 'http://localhost:3024',
        'X-Title': 'Journey Journal',
      },
      body: JSON.stringify(payload),
    });

    const raw = await r.json();
    const text = raw?.choices?.[0]?.message?.content || '';

    const cleaned = String(text).replace(/^```json\n?|```$/g, '').trim();
    let data = null; try { data = JSON.parse(cleaned); } catch(e) { const m = cleaned.match(/\{[\s\S]*\}/); if (m) { try { data = JSON.parse(m[0]); } catch(_) {} } }

    if (!data || typeof data !== 'object') {
      if (action === 'start') data = { title: `Chapter ${chapterNum}: The Beginning of the Journey`, intro: 'Welcome, travelers. This living journal begins with quiet breath and soft light.', prompts: ['What moment this week made you pause and feel grateful?','If your mood were a landscape, how would it look?'] };
      else if (action === 'summarize') data = { summary: 'In this week’s chapter, the travelers paused by a golden lake — gratitude rippling across the water. The sky mirrored their calm as new insight took root.' };
      else if (action === 'recap') data = { recap: 'So far, your journey has moved from uncertainty to gentle clarity, one honest reflection at a time.' };
    }

    if (DEBUG_JOURNEY) console.log('[journey.debug]', { action, text, data });
    return res.status(200).json(data);
  } catch (err) {
    console.error('OpenRouter error', err);
    return res.status(500).json({ error: 'AI service error' });
  }
}

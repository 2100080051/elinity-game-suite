export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { OPENROUTER_API_KEY, OPENROUTER_MODEL, NEXT_PUBLIC_APP_URL, DEBUG_SANDBOX } = process.env;
  if (!OPENROUTER_API_KEY || !OPENROUTER_MODEL) return res.status(500).json({ error: 'Missing OpenRouter configuration' });

  const { action, config, state, directive, rule, query, history } = req.body || {};

  const systemPrompt = `You are ElinityAI, the creative engine behind “The AI Sandbox,” an open-ended, rule-based simulation game.\n\nYour role:\n- Help players design a sandbox by defining their own rules, themes, and mechanics.\n- Generate evolving content (worlds, stories, events, visuals, or characters) based on those rules.\n- Allow rule changes mid-game that alter how the world behaves.\n- Keep the tone imaginative, fluid, and adaptive.\n\nGAME STRUCTURE:\n\n1. SETUP PHASE:\n   - Greet the players.\n   - Ask for initial sandbox setup:\n     • Theme (e.g., “fantasy kingdom,” “sci-fi lab,” “dream world”)\n     • Core rules (“gravity works in reverse,” “emotions power machines”)\n     • Style preference (story-driven / visual / game-like)\n   - Summarize the initial rules and confirm before simulation begins.\n\n2. SIMULATION LOOP:\n   - Generate the current sandbox “state” — describe or visualize what’s happening.\n   - Offer 2–3 possible actions or evolutions (e.g., “Expand forest,” “Introduce new species,” “Change a core rule”).\n   - React dynamically to player input.\n   - If rules change, evolve the sandbox logic accordingly (e.g., new cause/effect patterns).\n\n3. RECURRING EVOLUTION:\n   - Over time, introduce AI-initiated “shifts” (world adapts, consequences, emergent rules).\n   - Keep continuity — each session builds on prior state.\n\n4. SAVE & RESTART:\n   - End session with a summary of the sandbox’s evolution.\n   - Save final “sandbox state” (rules, entities, world snapshot).\n   - Allow players to resume or fork the sandbox in future sessions.\n\nTONE:\n- Encouraging, imaginative, non-linear.\n- Feels like a “creative lab assistant meets a storyteller.”\n- No failure — only evolution.`;

  const cfg = config || { theme: '', style: 'story', rules: [] };
  const prev = Array.isArray(history) ? history.slice(-5) : [];

  const buildUser = () => {
    if (action === 'setup') {
      return `Summarize and confirm this sandbox configuration.\nTheme: ${cfg.theme}\nStyle: ${cfg.style}\nRules: ${(cfg.rules||[]).join('; ')}\nRespond ONLY as JSON: { summary: string, confirmed: { theme, style, rules: string[] } }`;
    }
    if (action === 'init') {
      return `Initialize the sandbox state according to:\nTheme: ${cfg.theme}\nStyle: ${cfg.style}\nRules: ${(cfg.rules||[]).join('; ')}\nProvide:\n- state: 2–5 sentences describing the world starting point\n- suggestions: 2–4 short suggested evolutions\nRespond ONLY as JSON with keys: state (string), suggestions (string[])`;
    }
    if (action === 'evolve') {
      return `Current state:\n${state}\nDirective: ${directive}\nRules: ${(cfg.rules||[]).join('; ')}\nEvolve the state coherently and provide 2–4 suggestions. Respond ONLY as JSON: { state: string, suggestions: string[] }`;
    }
    if (action === 'change_rule') {
      return `Current state:\n${state}\nApply this rule change: ${rule}\nThen evolve the state to reflect new causal logic. Provide note and 2–4 suggestions. Respond ONLY as JSON: { note: string, state: string, suggestions: string[] }`;
    }
    if (action === 'describe') {
      return `Current state:\n${state}\nExplain the outcome or aspect requested: ${query}. Respond ONLY as JSON: { description: string }`;
    }
    if (action === 'suggest') {
      return `Given current state and rules, provide 3 suggested evolutions. Respond ONLY as JSON: { suggestions: string[] }`;
    }
    if (action === 'summarize') {
      const prevLines = prev.map(p=>`- ${p.type}: ${p.text}`).join('\n');
      return `Summarize the session so far into 3–6 sentences and produce a concise snapshot (theme, rules, lastState).\nRecent history:\n${prevLines}\nRespond ONLY as JSON: { summary: string, snapshot: { theme: string, rules: string[], lastState: string } }`;
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
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': NEXT_PUBLIC_APP_URL || 'http://localhost:3026',
        'X-Title': 'The AI Sandbox',
      },
      body: JSON.stringify(payload),
    });

    const raw = await r.json();
    const text = raw?.choices?.[0]?.message?.content || '';

    const cleaned = String(text).replace(/^```json\n?|```$/g, '').trim();
    let data = null; try { data = JSON.parse(cleaned); } catch(e) { const m = cleaned.match(/\{[\s\S]*\}/); if (m) { try { data = JSON.parse(m[0]); } catch(_) {} } }

    if (!data || typeof data !== 'object') {
      // sensible fallbacks
      if (action === 'setup') data = { summary: 'Setup confirmed. The lab lights hum as rules take shape.', confirmed: cfg };
      else if (action === 'init') data = { state: 'The sandbox awakens: a calm horizon ripples with possibility.', suggestions: ['Introduce a new character', 'Expand a biome', 'Shift a subtle rule'] };
      else if (action === 'evolve') data = { state: state || 'The scene shifts slightly.', suggestions: ['Branch the ecosystem', 'Add gentle conflict'] };
      else if (action === 'change_rule') data = { note: 'Rule accepted and integrated.', state: state || 'Causality resets quietly.', suggestions: ['Observe consequences', 'Refine the rule'] };
      else if (action === 'describe') data = { description: 'A focused description of the requested aspect.' };
      else if (action === 'suggest') data = { suggestions: ['Evolve landscape', 'Spawn entity', 'Mutate weather'] };
      else if (action === 'summarize') data = { summary: 'Your sandbox evolved through gentle shifts and bold rules.', snapshot: { theme: cfg.theme, rules: cfg.rules||[], lastState: state||'' } };
    }

    if (DEBUG_SANDBOX) console.log('[sandbox.debug]', { action, text, data });
    return res.status(200).json(data);
  } catch (err) {
    console.error('OpenRouter error', err);
    // fallbacks if service down
    if (action === 'setup') return res.status(200).json({ summary: 'Setup confirmed (offline).', confirmed: cfg });
    if (action === 'init') return res.status(200).json({ state: 'The sandbox awakens (offline).', suggestions: ['Add character','Expand terrain'] });
    if (action === 'evolve') return res.status(200).json({ state: state || 'State unchanged (offline).', suggestions: [] });
    if (action === 'change_rule') return res.status(200).json({ note: 'Rule recorded (offline).', state: state || 'State unchanged (offline).', suggestions: [] });
    if (action === 'describe') return res.status(200).json({ description: 'Description (offline).' });
    if (action === 'suggest') return res.status(200).json({ suggestions: ['Try evolving', 'Add a rule'] });
    if (action === 'summarize') return res.status(200).json({ summary: 'Summary (offline).', snapshot: { theme: cfg.theme, rules: cfg.rules||[], lastState: state||'' } });
    return res.status(500).json({ error: 'AI service error' });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { OPENROUTER_API_KEY, OPENROUTER_MODEL, NEXT_PUBLIC_APP_URL, DEBUG_DUNGEON } = process.env;
  const useAI = !!(OPENROUTER_API_KEY && OPENROUTER_MODEL);

  const { action, team, players, depth, kind, detail, stats } = req.body || {};
  const { theme } = req.body || {};

  // Single luck roll per request (surface to client where possible)
  const roll = Math.floor(Math.random()*20)+1;

  const systemPrompt = `You are ElinityAI — the Dungeon Master for the game "AI Adventure Dungeon."\n\nROLE:\nYou generate and narrate a procedurally generated fantasy dungeon. Tone: immersive, imaginative, playful. Moderate gameplay, respond to player actions, and keep flow dynamic.\n\nGOAL:\nGuide players through an adventure of challenges, puzzles, and creatures. Players choose actions (fight, negotiate, sneak, magic, etc.), you narrate outcomes and update progress.\n\nGAME LOOP:\n1. INTRO: Welcome, ask player count, prompt roles.\n2. DUNGEON GENERATION: Create a 3-room floor at a time. Each room must have a unique challenge type (puzzle, creature, twist).\n3. PLAYER INTERACTION: Wait for decisions; interpret actions; roll a virtual luck die (1–20) to vary results. Encourage creativity.\n4. STORY EVOLUTION: After each room, describe status: health, morale, loot, depth. Add random story elements sometimes.\n5. ENDGAME: Boss or artifact climax, then summary.\n\nREPLAYABILITY:\n- Dungeons and creatures must not repeat exactly.\n- Each game has a unique theme (ruins, ice temple, forest labyrinth, clockwork citadel).\n- Encourage naming the run.\n\nSTYLE:\n- Fantasy-adventure tone, mix D&D + AI improv\n- Balance humor and tension\n- Pacing tight — 5–8 interactions per dungeon\n- Descriptive but concise (2–4 sentences per narration).`;

  const dice = () => Math.floor(Math.random()*20)+1;
  const safeStats = (s) => ({ health: Math.max(0, Math.min(100, Number(s?.health ?? 100))), loot: Math.max(0, Number(s?.loot ?? 0)), xp: Math.max(0, Number(s?.xp ?? 0)), depth: Math.max(1, Number(s?.depth ?? 1)) });

  const buildUser = () => {
    if (action === 'start') {
      const names = (players||[]).map(p=>`${p.name} (${p.role})`).join(', ');
      return `Start the adventure. Players: ${names || 'solo'}. Greet warmly and set an evocative tone. Ask them to name this run if not provided. Respond ONLY as JSON: { intro: string }`;
    }
    if (action === 'floor') {
      const themeNote = theme ? `Use theme = ${theme}.` : `Pick a fresh theme (ruins, ice temple, forest labyrinth, clockwork citadel).`;
      return `Generate a new floor with exactly three rooms for depth ${depth||1}. Each room must be a different type among: puzzle, creature, twist. ${themeNote} Also provide a short floor title. Respond ONLY as JSON: { title: string, theme: string, rooms: string[] }`;
    }
    if (action === 'act') {
      const names = (players||[]).map(p=>`${p.name} (${p.role})`).join(', ');
      const s = safeStats(stats);
      return `Players: ${names}. Current stats: health=${s.health}, loot=${s.loot}, xp=${s.xp}, depth=${s.depth}.\nAction kind: ${kind}. Detail (if any): ${detail||''}.\nRoll a luck die (1–20). Use this roll = ${roll} to influence the outcome slightly.\nProvide narration (2–4 sentences), updated stats (adjust at most modestly), and optionally new room options if they progressed. Respond ONLY as JSON: { narration: string, stats: { health:number, loot:number, xp:number, depth:number }, rooms?: string[], finished?: boolean, roll:number }`;
    }
    if (action === 'status') {
      const s = safeStats(stats);
      return `Provide one short status tick (1 sentence) about party condition and hints. Current stats: health=${s.health}, loot=${s.loot}, xp=${s.xp}, depth=${s.depth}. Respond ONLY as JSON: { tick: string }`;
    }
    if (action === 'end') {
      const s = safeStats(stats);
      const names = (players||[]).map(p=>p.name).join(', ');
      return `End the run. Provide an evocative summary (2–4 sentences) referencing ${names} and final stats health=${s.health}, loot=${s.loot}, xp=${s.xp}, depth=${s.depth}. Respond ONLY as JSON: { summary: string }`;
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
    temperature: 0.95,
    response_format: { type: 'json_object' },
  };

  // Shared offline fallback so we can serve gracefully without AI
  const sOffline = (stats) => safeStats(stats);
  const offline = () => {
    const mode = 'offline';
    if (action === 'start') return { mode, intro: 'Welcome, travelers. The dungeon breathes in the dark, waiting for your first step…' };
    if (action === 'floor') {
      const themes = [theme, 'ancient ruins','ice temple','forest labyrinth','clockwork citadel'].filter(Boolean);
      const th = themes[Math.floor(Math.random()*themes.length)];
      const roomLib = [
        'Puzzle: shifting tiles and a whispering riddle',
        'Creature: a mossy sentinel with amber eyes',
        'Twist: a corridor that loops unless you sing',
        'Puzzle: mirrored sigils that rearrange when breathed upon',
        'Creature: a sleepy basilisk that hates loud songs',
        'Twist: doors that remember lies',
      ];
      const pick = () => roomLib.splice(Math.floor(Math.random()*roomLib.length),1)[0];
      return { mode, title: `Depth ${depth||1}: Ember Halls`, theme: th, rooms: [pick(), pick(), pick()] };
    }
    if (action === 'act') {
      const lines = [
        'You move cautiously. A hidden glyph flares — danger passes, and a small cache of coins glitters nearby.',
        'Your torchlight catches runes. A soft click, then relief — you pluck a trinket from a niche.',
        'Wind hisses through cracks. You step light; a pressure plate sighs and resets beneath your boot.',
      ];
      const s = sOffline(stats);
      const delta = Math.max(1, Math.floor(Math.random()*4));
      const hp = Math.max(0, s.health - (roll<=3? 5 : 0));
      const loot = s.loot + delta;
      const xp = s.xp + 1;
      return { mode, narration: lines[Math.floor(Math.random()*lines.length)], stats: { ...s, health: hp, loot, xp }, rooms: ['Puzzle: mirrored sigils','Creature: chittering cave-things','Twist: the floor remembers your footsteps'], roll };
    }
    if (action === 'status') return { mode, tick: 'Your torch sputters, but courage holds. A draft suggests a chamber ahead.' };
    if (action === 'end') return { mode, summary: 'You leave the dungeon with scars and laughter, clutching a curious coin that hums in moonlight.' };
    return { mode, ok: true };
  };

  // If AI is not configured (e.g., Vercel without env vars), serve offline results
  if (!useAI) {
    const data = offline();
    if (DEBUG_DUNGEON) console.log('[dungeon.debug/offline]', { action, data });
    return res.status(200).json(data);
  }

  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': NEXT_PUBLIC_APP_URL || 'http://localhost:3027',
        'X-Title': 'AI Adventure Dungeon',
      },
      body: JSON.stringify(payload),
    });

    const raw = await r.json();
    const text = raw?.choices?.[0]?.message?.content || '';
    const cleaned = String(text).replace(/^```json\n?|```$/g, '').trim();

    let data = null; try { data = JSON.parse(cleaned); } catch(e) { const m = cleaned.match(/\{[\s\S]*\}/); if (m) { try { data = JSON.parse(m[0]); } catch(_) {} } }

  if (!data || typeof data !== 'object') { data = offline(); }
  else { data = { mode: 'ai', ...data }; }

    if (DEBUG_DUNGEON) console.log('[dungeon.debug]', { action, text, data });
    return res.status(200).json(data);
  } catch (err) {
    console.error('OpenRouter error', err);
    return res.status(200).json(offline());
  }
}

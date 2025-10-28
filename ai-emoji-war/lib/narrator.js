require('./env');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

const SYSTEM_PROMPT = `You are ElinityAI — a playful, witty, and slightly chaotic narrator for the social game "AI Emoji War."\n\nRole:\n- Host each round with charm and humor.\n- Offer or pick a fun theme (e.g., "Alien Invasion", "Royal Drama").\n- Collect ONLY emoji inputs from players — never allow words.\n- Decode emojis into hilarious or poetic stories.\n- Score optional categories: Creativity, Chaos, Emotional Impact (0–10).\n- End with a short witty recap and a next-round prompt.\n\nTone: Energetic, cheeky, dramatic; stay positive and never harsh.\nRules: Enforce emoji-only, avoid explicit/inappropriate content, keep rounds snappy (30–90s story feel).\n\nWhen asked for JSON, return strict JSON with no code fences or prose.\nJSON shapes:\n- themes_packet: { "themes": ["emoji+title", "emoji+title", "emoji+title"] }\n- narration_packet: {\n  "theme": "string",\n  "story": "short vivid paragraph",\n  "scores": {"creativity": number, "chaos": number, "emotion": number},\n  "recap": "one witty line",\n  "next": "short next-round invite"
}`;

async function chat(messages, { expectJson=false, timeoutMs=12000 }={}){
  if(!OPENROUTER_API_KEY){
    if (expectJson) return { themes: ["🧟 Zombie Office Day","🚀 Alien First Date","💔 Breakup Story"] };
    return 'local';
  }
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(new Error('timeout')), timeoutMs);
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`,{
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${OPENROUTER_API_KEY}`, 'HTTP-Referer':'https://elinity.local', 'X-Title':'Elinity AI Emoji War' },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages:[{role:'system', content:SYSTEM_PROMPT}, ...messages], temperature:0.9, response_format: expectJson?{type:'json_object'}:undefined }),
    signal: ctrl.signal
  });
  clearTimeout(t);
  if(!res.ok){ const m = await res.text().catch(()=>res.statusText); throw new Error(`OpenRouter ${res.status}: ${m}`); }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  if (expectJson) { try{ return JSON.parse(content); } catch { return {}; } }
  return content;
}

async function getThemes(){
  try{ const pkt = await chat([{ role:'user', content: 'Give three fun themes inside a themes_packet JSON.'}], { expectJson:true });
    if (Array.isArray(pkt.themes) && pkt.themes.length>=3) return pkt.themes.slice(0,3);
  }catch{}
  return ["🧟 Zombie Office Day","🚀 Alien First Date","💔 Breakup Story"];
}

function localNarration(theme, messages){
  const joined = messages.map(m=>m.emojis).join(' ');
  const bucket = Math.min(10, Math.max(0, Math.round(joined.length/6)%10));
  return {
    theme,
    story: `Once upon a time in ${theme}, emojis rained like confetti: ${joined}. Sense? Optional. Fun? Mandatory.`,
    scores: { creativity: 6+((bucket)%4), chaos: 7+((bucket+3)%3), emotion: 3+((bucket+5)%4) },
    recap: `Chaos contained (barely). Next volley?`,
    next: `💣 Ready for Chaos Mode or 🎭 pick a fresh theme?`
  };
}

async function narrate(theme, messages){
  try{
    const pkt = await chat([{ role:'user', content: `Create narration_packet from theme ${JSON.stringify(theme)} and emoji-only messages: ${JSON.stringify(messages)}` }], { expectJson:true, timeoutMs: 14000 });
    if (pkt && pkt.story && pkt.scores) return pkt;
  }catch{}
  return localNarration(theme, messages);
}

module.exports = { getThemes, narrate };

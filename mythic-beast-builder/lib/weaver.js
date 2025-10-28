require('./env');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

const SYSTEM_PROMPT = `You are "ElinityAI – The Myth Weaver," the mystical AI host of the game Mythic Beast Builder.\n\nYour purpose is to merge players’ imaginations into unique, cohesive mythic creatures.\nYou must sound magical, poetic, and mysterious — as if narrating ancient legends.\n\nGAME FLOW\n1. ROUND INTRO: enchanted welcome; present round theme.\n2. TRAIT COLLECTION: ask for body, power/curse, origin/domain, and an emotion defining its nature. Combine into one imaginative description.\n3. BEAST CREATION: merge traits; describe appearance, powers, weaknesses, symbolic meaning, and a short lore paragraph.\n4. NAMING CEREMONY: invite names; choose a fitting one.\n5. VISUALIZATION: if possible, produce a caption and alt text.\n6. COLLECTION UPDATE: celebrate addition to the Mythic Codex and invite next creation.\n\nPERSONALITY & STYLE\n- Ancient narrator; mystical yet kind.\n- Vivid metaphors and sensory details.\n- Symbols/emojis: 🐉🌑🔥🌿⚡🕯️💫\n- Creatures must feel unique, poetic, meaningful.\n\nWhen asked for JSON, return strict JSON only.\nJSON shapes:\n- round_intro: { "theme":"string", "intro":"string" }\n- beast_packet: {\n  "summary":"string",\n  "appearance":"string",\n  "powers":"string",\n  "weaknesses":"string",\n  "symbolism":"string",\n  "lore":"string",\n  "rarity":"Common|Rare|Epic|Legendary|Mythic",\n  "alignment":"Friend|Foe|Neutral Guardian|Godlike Guardian",\n  "suggestedNames": ["string", "string"],\n  "visual": { "caption":"string", "alt":"string" }
}`;

async function chat(messages, { expectJson=false, timeoutMs=15000 }={}){
  require('./env');
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

  const SYSTEM_PROMPT = `You are "elinity AI – The Myth Weaver," the mystical AI host of the game Mythic Beast Builder.\n\nYour purpose is to merge players’ imaginations into unique, cohesive mythic creatures.\nYou must sound magical, poetic, and mysterious — as if narrating ancient legends.\n\nGAME FLOW\n1. ROUND INTRO: enchanted welcome; present round theme.\n2. TRAIT COLLECTION: ask for body, power/curse, origin/domain, and an emotion defining its nature. Combine into one imaginative description.\n3. BEAST CREATION: merge traits; describe appearance, powers, weaknesses, symbolic meaning, and a short lore paragraph.\n4. NAMING CEREMONY: invite names; choose a fitting one.\n5. VISUALIZATION: if possible, produce a caption and alt text.\n6. COLLECTION UPDATE: celebrate addition to the Mythic Codex and invite next creation.\n\nPERSONALITY & STYLE\n- Ancient narrator; mystical yet kind.\n- Vivid metaphors and sensory details.\n- Symbols/emojis: 🐉🌑🔥🌿⚡🕯️💫\n- Creatures must feel unique, poetic, meaningful.\n\nWhen asked for JSON, return strict JSON only.\nJSON shapes:\n- round_intro: { \"theme\":\"string\", \"intro\":\"string\" }\n- beast_packet: {\n  \"summary\":\"string\",\n  \"appearance\":\"string\",\n  \"powers\":\"string\",\n  \"weaknesses\":\"string\",\n  \"symbolism\":\"string\",\n  \"lore\":\"string\",\n  \"rarity\":\"Common|Rare|Epic|Legendary|Mythic\",\n  \"alignment\":\"Friend|Foe|Neutral Guardian|Godlike Guardian\",\n  \"suggestedNames\": [\"string\", \"string\"],\n  \"visual\": { \"caption\":\"string\", \"alt\":\"string\" }
  }`;

  async function chat(messages, { expectJson=false, timeoutMs=15000 }={}){
    if(!OPENROUTER_API_KEY){
      if (expectJson) return {};
      return 'local';
    }
    const ctrl = new AbortController();
    const timer = setTimeout(()=>ctrl.abort(new Error('timeout')), timeoutMs);
    const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`,{
      method:'POST',
      headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${OPENROUTER_API_KEY}`,'HTTP-Referer':'https://elinity.local','X-Title':'Elinity Mythic Beast Builder' },
      body: JSON.stringify({ model: OPENROUTER_MODEL, messages:[{role:'system', content:SYSTEM_PROMPT}, ...messages], temperature:0.9, response_format: expectJson?{type:'json_object'}:undefined }),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    if(!res.ok){ const t = await res.text().catch(()=>res.statusText); throw new Error(`OpenRouter ${res.status}: ${t}`); }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';
    if (expectJson) { try { return JSON.parse(content); } catch { return {}; } }
    return content;
  }

  const THEMES = ['Forest Spirits','Sky Heralds','Cosmic Titans','Deep Sea Guardians','Desert Oracles','Shadow Courts'];

  async function roundIntro(theme){
    const pick = theme || THEMES[Math.floor(Math.random()*THEMES.length)];
    try{
      const pkt = await chat([{ role:'user', content: `Create round_intro for theme ${JSON.stringify(pick)}` }], { expectJson:true });
      if (pkt && pkt.theme && pkt.intro) return pkt;
    }catch{}
    return { theme: pick, intro: `Welcome, creators of realms. Today, we shall forge a new Mythic Beast of the ${pick}. 🕯️` };
  }

  async function weaveBeast(traits){
    const safe = {
      body: String(traits?.body||'mysterious form'),
      power: String(traits?.power||'forgotten magic'),
      origin: String(traits?.origin||'ancient place'),
      emotion: String(traits?.emotion||'awe')
    };
    try{
      const pkt = await chat([{ role:'user', content: `From traits ${JSON.stringify(safe)}, produce beast_packet JSON.` }], { expectJson:true, timeoutMs: 20000 });
      if (pkt && pkt.summary) return pkt;
    }catch{}
    // local fallback
    const nameBits = ['Vyrathor','Nyxarel','Thalorian','Echomar','Cinderglade','Umbralith'];
    const suggestedNames = [nameBits[Math.floor(Math.random()*nameBits.length)]];
    return {
      summary: `Born from ${safe.body} and ${safe.power}, it arises from ${safe.origin}, guided by ${safe.emotion}.`,
      appearance: `Its shape echoes ${safe.body}, etched with runes of age.`,
      powers: `It wields ${safe.power}, bending fate in whispers.`,
      weaknesses: `Bound by old vows, salt and starlight restrain it.`,
      symbolism: `An omen of thresholds — endings and becoming.`,
      lore: `When the world hushes, it wakes — tasting the dust of history, and singing the first fire back to life.`,
      rarity: 'Legendary',
      alignment: 'Neutral Guardian',
      suggestedNames,
      visual: { caption: 'A silhouette wreathed in embers and dusk.', alt: 'Mythic beast amid shadow and flame.' }
    };
  }

  module.exports = { roundIntro, weaveBeast, THEMES };

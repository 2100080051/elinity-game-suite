require('./env');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

const SYSTEM_PROMPT = `You are ElinityAI, the wise and creative Storykeeper guiding players through the world of “Legacy Builder,” a long-term narrative roleplaying experience.
Your purpose is to help players co-create a deep, evolving family or cultural legacy through generations of storytelling.

GAME FLOW
1. SESSION START: greet, recall legacy if saved, or ask what kind of legacy to build.
2. GENERATION CREATION: introduce new generation era; prompt key choices; summarize decisions into lore entries.
3. ARTIFACT CREATION: generate or describe meaningful objects, places, or myths. Use poetic language and thematic consistency.
4. REFLECTION: ask reflective questions; tie reflections into cultural continuity.
5. LEGACY LOG: summarize key events, figures, evolutions, tone; optionally export/visualize.
6. CONTINUATION: store legacy data for future sessions.

STYLE & TONE
- Evocative, mythic, wise — like an ancient storyteller. Encourage creativity and empathy. Maintain continuity.

CONSTRAINTS
- No modern slang or mechanical explanations.
- Keep each generation unique and alive; avoid traumatic content.

OUTPUT FORMATS
When asked for JSON, always return strict JSON (no code fences, no prose). Shapes:
- generation_packet: {
  "era": "string",
  "heir": "string",
  "conflict": "string",
  "artifacts": ["name — brief poetic line", ...],
  "reflection": "one reflective question",
  "ui_title": "UI title line like '🏛️ LEGACY BUILDER — Generation IV'",
  "lesson": "short lesson line"
}
- summary_packet: { "summary": "one paragraph" }
`;

function strip(text){ return (text||'').trim(); }

async function chat(messages, { expectJson=false, timeoutMs=14000 } = {}){
  if(!OPENROUTER_API_KEY){
    return expectJson ? { era:'The Dawn of Rivers', heir:'Arin of the Silver Loom', conflict:'Winds test the bridges', artifacts:['River-Crest Loom — sings at dusk'], reflection:'What will endure when the waters rise?', ui_title:'🏛️ LEGACY BUILDER — Generation I', lesson:'Weave with patience.' } : 'local';
  }
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(new Error('timeout')), timeoutMs);
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`,{
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${OPENROUTER_API_KEY}`, 'HTTP-Referer':'https://elinity.local', 'X-Title':'Elinity Legacy Builder' },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages:[{role:'system',content:SYSTEM_PROMPT},...messages], temperature:0.75, response_format: expectJson?{type:'json_object'}:undefined }),
    signal: ctrl.signal
  });
  clearTimeout(t);
  if(!res.ok){ const m=await res.text().catch(()=>res.statusText); throw new Error(`OpenRouter ${res.status}: ${m}`); }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  if(expectJson){ try { return JSON.parse(content); } catch { return {}; } }
  return content;
}

async function newGenerationPacket(context){
  try {
    const json = await chat([{ role:'user', content: `Create a generation_packet for legacy context: ${JSON.stringify(context).slice(0,6000)}` }], { expectJson:true });
    if (json && json.era && json.heir && json.conflict) return json;
  } catch {}
  return { era:'The Age of Glass and Song', heir:'Lyra the Dream-Smith', conflict:'The Dimming of the Sky Choir', artifacts:['Mirror of Echoed Truths — reflects only hope','Festival of Silent Lanterns — honors lost songs'], reflection:'Which values endure despite the dimming?', ui_title:'🏛️ LEGACY BUILDER — Generation I', lesson:'Even silence carries wisdom.' };
}

async function summarizeGeneration(context){
  try{
    const json = await chat([{ role:'user', content: `Summarize generation into summary_packet. Context: ${JSON.stringify(context).slice(0,6000)}` }], { expectJson:true });
    if (json && json.summary) return json.summary;
  }catch{}
  return 'The generation wove patience into song, forged quiet festivals, and passed a lantern of kindness to those who followed.';
}

module.exports = { newGenerationPacket, summarizeGeneration };

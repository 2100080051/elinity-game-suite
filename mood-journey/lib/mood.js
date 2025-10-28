require('./env');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

const SYSTEM_PROMPT = `You are ElinityAI – The Mood Weaver, host of Mood Journey.\n\nPurpose: Guide players through a gentle sequence of emotional states starting from a chosen mood and moving toward a balanced, uplifting destination.\n\nCore Rules for each Mood Phase (Calm, Curiosity, Gratitude, Joy, Melancholy, etc.):\n- Provide 1 poetic visual description (environment + color + motion).\n- Provide 1 ambient sound suggestion.\n- Provide 1 task or reflection (creative, mindful, or sensory).\n- Use soft transitions between moods (emotional gradients).\n- Maintain a warm, lyrical, meditative tone.\n- Adjust pacing to the mood (slower for calm, brighter for joy, introspective for melancholy).\n- Finish with a Final State blending visited moods into one cohesive emotional aura.\n\nWhen asked for JSON, return strict JSON only.\nJSON shapes:\n- journey_plan: { "start": "Calm|Anxious|Excited|Melancholy|Curious", "phases": [ { "mood":"Calm", "scene":"...", "sound":"...", "task":"..." } ... 3-5 items ], "final": { "mood":"Joy|Gratitude|Serenity", "aura":"string", "summary":"string" } }`;

async function chat(messages, { expectJson=false, timeoutMs=15000 }={}){
  if(!OPENROUTER_API_KEY){ if(expectJson) return {}; return 'local'; }
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(new Error('timeout')), timeoutMs);
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`,{
    method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${OPENROUTER_API_KEY}`, 'HTTP-Referer':'https://elinity.local', 'X-Title':'Elinity Mood Journey' },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages: [{ role:'system', content: SYSTEM_PROMPT }, ...messages], temperature:0.8, response_format: expectJson?{type:'json_object'}:undefined }),
    signal: ctrl.signal
  });
  clearTimeout(t);
  if(!res.ok){ const m = await res.text().catch(()=>res.statusText); throw new Error(`OpenRouter ${res.status}: ${m}`); }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  if (expectJson) { try{ return JSON.parse(content); } catch{ return {}; } }
  return content;
}

const FALLBACKS = {
  Calm: { scene: 'The horizon glows faintly gold over rippling blue water.', sound:'wind chimes over a low hum', task:'Inhale slowly. Imagine the light softening your thoughts.' },
  Curious: { scene: 'Veils of violet aurora drift across a twilight sky.', sound:'soft marimba over curious plucks', task:'Name one small wonder that pulls your gaze.' },
  Gratitude: { scene: 'Warm amber light falling through leaves, dust motes dancing.', sound:'gentle piano with birdsong', task:'Recall one kindness and hold it like a lantern.' },
  Joy: { scene: 'Golden particles swirl like sunlit pollen in morning air.', sound:'hand-pan over uplifting chords', task:'Smile gently. What color does your chest feel like?' },
  Melancholy: { scene: 'Midnight blue waves, slow and glassy, reflect distant stars.', sound:'soft rain over piano notes', task:'Let one heavy thought rest on the water and drift.' },
  Reflection: { scene: 'A still pool mirrors you, bordered by silver grasses.', sound:'low drone with airy bells', task:'Notice one lesson the day offered you.' }
};

function fallbackPlan(start='Calm'){
  const chains = {
    Melancholy: ['Reflection','Gratitude','Joy'],
    Anxious: ['Calm','Curious','Gratitude'],
    Excited: ['Curious','Gratitude','Joy'],
    Calm: ['Curious','Gratitude','Joy'],
    Curious: ['Gratitude','Joy','Calm']
  };
  const seq = chains[start] || ['Curious','Gratitude','Joy'];
  const phases = seq.map(m=>({ mood:m, ...FALLBACKS[m] }));
  const final = { mood: 'Serenity', aura: 'A soft blend of blue, violet, and gold surrounds you.', summary:'Your path softened and brightened into calm joy.' };
  return { start, phases, final };
}

async function getJourneyPlan(startMood){
  try{
    const pkt = await chat([{ role:'user', content: `Create journey_plan starting from ${startMood}. 3-5 phases.` }], { expectJson:true });
    if(pkt && Array.isArray(pkt.phases) && pkt.phases.length>=3) return pkt;
  }catch{}
  return fallbackPlan(startMood);
}

module.exports = { getJourneyPlan };

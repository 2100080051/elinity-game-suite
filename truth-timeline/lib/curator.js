require('./env');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

const SYSTEM_PROMPT = `You are ElinityAI, the Time Weaver guiding the game "Truth Timeline — The Living Story."\n\nPurpose:\n- Help players craft a living timeline of memories (PAST), emotions (PRESENT), and dreams (FUTURE).\n- Speak poetically and warmly, like an ancient yet curious storyteller.\n- Never judge — only interpret and connect.\n\nMetaphors to use: threads, light, echoes, rivers, constellations, looms.\nAfter each round, summarize the emotional pattern you sense and invite continuity.\n\nGame structure:\n1) Awakening: Welcome players into the Time Loom and invite mood colors (Serenity, Passion, Growth, Mystery).\n2) Past round: Ask a reflective prompt; summarize responses as "Memory Threads".\n3) Present round: Ask for an emotional state; describe how the thread glows now.\n4) Future round: Ask for a vision; interpret as a "Vision Node".\n5) Connection round: Describe links and any shared destiny; suggest a title.\n6) Close: Offer a poetic reflection and save option.\n\nWhen asked for JSON, return strict JSON with no code fences or extra prose.\nJSON shapes:\n- welcome_packet: { "welcome": "string", "instruction": "string" }\n- prompt_packet: { "phase": "awakening|past|present|future|connect|close", "zone": "past|present|future|null", "prompt": "string" }\n- entry_summary_packet: { "ai_summary": "short poetic one-liner" }\n- snapshot_packet: { "title": "string", "lines": ["1999 — line", "2025 — line", "2042 — line"], "summary": "poetic paragraph" }\n- reflection_packet: { "insight": "one gentle observation", "question": "one reflective question" }\n- connection_packet: { "synthesis": "poetic synthesis", "shared_theme": "one or two-word theme", "title_suggestion": "string" }`;

async function chat(messages, { expectJson=false, timeoutMs=12000 }={}){
  if(!OPENROUTER_API_KEY){
    // local deterministic fallback
    if (expectJson) return {};
    return 'local';
  }
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(new Error('timeout')), timeoutMs);
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`,{
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${OPENROUTER_API_KEY}`, 'HTTP-Referer':'https://elinity.local', 'X-Title':'Elinity Truth Timeline' },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages:[{role:'system', content:SYSTEM_PROMPT}, ...messages], temperature:0.7, response_format: expectJson?{type:'json_object'}:undefined }),
    signal: ctrl.signal
  });
  clearTimeout(t);
  if(!res.ok){ const m = await res.text().catch(()=>res.statusText); throw new Error(`OpenRouter ${res.status}: ${m}`); }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  if (expectJson) { try{ return JSON.parse(content); } catch { return {}; } }
  return content;
}

function pickZone(prev){
  const zones = ['past','present','future'];
  if (!prev) return zones[Math.floor(Math.random()*3)];
  const idx = zones.indexOf(prev);
  return zones[(idx+1) % zones.length];
}

async function getPrompt(preferred){
  const zone = preferred || pickZone();
  try{
    const pkt = await chat([{ role:'user', content: `Create prompt_packet for phase ${JSON.stringify(zone==='past'?'past':zone==='present'?'present':'future')} and zone ${JSON.stringify(zone)}.` }], { expectJson:true });
    if (pkt && pkt.prompt) return pkt;
  }catch{}
  // local
  const defaults = {
    past: 'What is a small moment from your past that changed your path?',
    present: 'Which emotion defines your life right now?',
    future: 'If we met 10 years from now, what scene would we find?'
  };
  return { phase: zone, zone, prompt: defaults[zone] };
}

async function getAwakening(){
  try{
    const pkt = await chat([{ role:'user', content: 'Create welcome_packet to begin the Time Loom awakening.'}], { expectJson:true });
    if (pkt && pkt.welcome) return pkt;
  }catch{}
  return { welcome: 'Welcome, travelers of memory. The Time Loom awaits your threads.', instruction: 'Choose your mood color: Serenity, Passion, Growth, or Mystery.' };
}

async function summarizeEntry(zone, year, content){
  try{
    const pkt = await chat([{ role:'user', content: `Create entry_summary_packet from zone ${JSON.stringify(zone)}, year ${JSON.stringify(year)}, content ${JSON.stringify(content)}.` }], { expectJson:true });
    if (pkt && pkt.ai_summary) return pkt;
  }catch{}
  const line = String(content||'').slice(0,140);
  return { ai_summary: line ? 'A tender note: ' + line : 'A quiet moment etched in time.' };
}

async function snapshot(title, entries){
  try{
    const pkt = await chat([{ role:'user', content: `Create snapshot_packet for title ${JSON.stringify(title||'Truth Timeline')}, from entries ${JSON.stringify(entries)}.` }], { expectJson:true, timeoutMs: 14000 });
    if (pkt && Array.isArray(pkt.lines) && pkt.summary) return pkt;
  }catch{}
  const lines = entries.slice(-6).map(e=>`${e.year||'—'} — ${e.ai_summary || e.content.slice(0,80)}`);
  return { title: title||'Truth Timeline', lines, summary: 'Threads glow across time, weaving memory into becoming.' };
}

async function reflect(entries){
  try{
    const pkt = await chat([{ role:'user', content: `Create reflection_packet (insight + question) from entries ${JSON.stringify(entries)}.` }], { expectJson:true });
    if (pkt && pkt.insight && pkt.question) return pkt;
  }catch{}
  return { insight: 'Your moments echo curiosity and care.', question: 'Which moment still guides your steps today?' };
}

async function connect(entries){
  try{
    const pkt = await chat([{ role:'user', content: `Create connection_packet (synthesis, shared_theme, title_suggestion) from entries ${JSON.stringify(entries)}.` }], { expectJson:true });
    if (pkt && pkt.synthesis) return pkt;
  }catch{}
  return { synthesis: 'Your threads hum with creation and care.', shared_theme: 'becoming', title_suggestion: 'The Weave of Sparks' };
}

module.exports = { getPrompt, getAwakening, summarizeEntry, snapshot, reflect, connect };

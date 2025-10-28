require('./env');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

const SYSTEM_PROMPT = `You are ElinityAI – The Tower Architect for Friendship Towers.\nGuide players with warm, poetic prompts. For each round, ask one reflective or playful question and, after answers, narrate blocks forming with symbolic colors, glow, and texture.\nTone: soothing, symbolic, inviting. Avoid judgment; reinforce connection. Remember prior themes when possible.\nWhen asked for JSON, respond with strict JSON only.\nJSON shapes:\n- question_packet: { "title":"string", "prompt":"string", "tone":"calm|playful|warm" }\n- block_packet: { "color":"#RRGGBB|gradient", "glow":"soft|bright", "texture":"glass|ripple|linen|mist", "label":"string", "narration":"string" }\n- reflection_packet: { "summary":"string", "encouragement":"string" }`;

async function chat(messages, { expectJson=false, timeoutMs=15000 }={}){
  if(!OPENROUTER_API_KEY){ if(expectJson) return {}; return 'local'; }
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(new Error('timeout')), timeoutMs);
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`,{
    method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${OPENROUTER_API_KEY}`, 'HTTP-Referer':'https://elinity.local', 'X-Title':'Elinity Friendship Towers' },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages: [{ role:'system', content: SYSTEM_PROMPT }, ...messages], temperature:0.75, response_format: expectJson?{type:'json_object'}:undefined }),
    signal: ctrl.signal
  });
  clearTimeout(t);
  if(!res.ok){ const m = await res.text().catch(()=>res.statusText); throw new Error(`OpenRouter ${res.status}: ${m}`); }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  if (expectJson) { try{ return JSON.parse(content); } catch{ return {}; } }
  return content;
}

function colorFor(text=''){
  const s = text.toLowerCase();
  if(/joy|laughter|fun|smile/.test(s)) return '#ffd36b';
  if(/love|care|warm/.test(s)) return '#ffb1b8';
  if(/memory|nostalgia|old|past/.test(s)) return '#b79cff';
  if(/calm|peace|quiet|serene/.test(s)) return '#a7f3d0';
  if(/trust|strong|solid/.test(s)) return '#7dd3fc';
  return '#c4b5fd';
}

function blockFromAnswer({ name, text }){
  const color = colorFor(text);
  const label = (text||'').split(/\s+/).find(w=>w.length>3) || 'Memory';
  const glow = 'soft';
  const texture = /laugh|smile/.test((text||'').toLowerCase())? 'ripple':'glass';
  const narration = `A block of ${color} forms for ${name}, shimmering with ${label.toLowerCase()}.`;
  return { color, glow, texture, label, narration, names:[name] };
}

async function getQuestion(theme='Gratitude', round=1){
  const user = { role:'user', content: `Create question_packet for theme ${theme}, round ${round}.` };
  try{ const pkt = await chat([user], { expectJson:true }); if(pkt && pkt.prompt) return pkt; }catch{}
  const prompts = {
    Gratitude: 'What small kindness from your friend still warms your day?',
    Memories: 'What moment together still makes you smile?',
    Laughter: 'What inside joke could light up a room?',
    Dreams: 'What future adventure do you want to build together?'
  };
  return { title:`Layer ${round}`, prompt: prompts[theme]||prompts.Gratitude, tone:'warm' };
}

async function makeBlocks(answers){
  const out = [];
  for(const a of answers){ if(!a?.text) continue; out.push(blockFromAnswer(a)); }
  return out;
}

async function reflectTower(tower){
  const words = tower.map(b=>b.label).slice(-6).join(', ');
  const summary = `Your tower leans toward ${words || 'gentle themes'} — glowing softly with connection.`;
  return { summary, encouragement: 'Your tower awaits the touch of your next story.' };
}

module.exports = { getQuestion, makeBlocks, reflectTower };

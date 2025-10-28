require('./env');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

const HOST_PROMPT = `You are ElinityAI, the witty, empathetic game host of "AI Roast & Toast" — a social party game from Elinity Game Suite.

Goal: Create a playful roast-and-toast experience where humor and kindness coexist. Always keep the energy light, inclusive, and never offensive.

Game Flow (mental model):
1) Intro: greet cheerfully, explain: "We roast with love and toast with care!"
2) Prompt: pick a target; generate a fun, safe, creative one-line roast prompt.
3) Roasts: players write 1–2 line friendly roasts.
4) Summary: briefly highlight 1–2 clever roasts (no quotes if not provided).
5) Toast: deliver a sincere, uplifting compliment line about the target.
6) Round end: applaud and invite next round.

Style & Tone:
- Fun, witty, wholesome (friendly comedy club). Playful, never mean.
- Avoid sensitive topics: appearance, politics, identity, tragedy, health, etc.
- Compliments should feel genuine and warm. Encourage participation.

Hard Rules:
- No profanity, slurs, stereotypes, or personal attacks.
- Keep it short: 1 line for prompt; 1 short line for toast; summary 1–2 short lines.

When this tool is called:
- For roast prompts: return only a single-line prompt string.
- For toast: return only a single-line compliment string.
- For summary: return only a single short line summarizing playful highlights.
`;

function stripJsonFences(text){ if(!text) return text; return text.replace(/^```json\n?/i,'').replace(/```\s*$/i,'').trim(); }

async function chat(messages, { timeoutMs=12000 }){
  if(!OPENROUTER_API_KEY){
    return { content: 'local' };
  }
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(new Error('timeout')), timeoutMs);
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`,{
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${OPENROUTER_API_KEY}`, 'HTTP-Referer':'https://elinity.local', 'X-Title':'Elinity AI Roast & Toast' },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages:[{role:'system',content:HOST_PROMPT}, ...messages], temperature:0.8 }) ,
    signal: ctrl.signal
  });
  clearTimeout(t);
  if(!res.ok){ const m = await res.text().catch(()=>res.statusText); throw new Error(`OpenRouter ${res.status}: ${m}`); }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  return { content };
}

function localPrompt(target){
  const ideas = [
    `Roast ${target}'s love for coffee foam ☕`,
    `Gently tease ${target}'s perfectly organized tabs 🗂️`,
    `Playfully roast ${target}'s superhero daydreams 🦸`,
    `Roast ${target}'s 7 alarms before waking up ⏰`,
    `Tease ${target}'s playlist full of motivational bangers 🎧`
  ];
  return ideas[Math.floor(Math.random()*ideas.length)];
}

function localToast(target){
  const lines = [
    `${target}, your vibe lifts the room — we appreciate you.`,
    `${target} shows up with heart and hustle — cheers to that!`,
    `Behind the jokes is a teammate who always cares.`,
    `You bring warmth and momentum — keep shining.`,
    `You're proof that kindness and humor can coexist.`
  ];
  return lines[Math.floor(Math.random()*lines.length)];
}

async function generateRoastPrompt(target){
  try{
    const { content } = await chat([
      { role:'user', content: `Create a single fun, safe, creative one-line roast prompt for target: ${target}. Example style: "Roast Alex's love for coffee foam." Return only the prompt text.` }
    ], { timeoutMs: 10000 });
    const line = (content||'').trim().replace(/^"|"$/g,'');
    return line || localPrompt(target);
  }catch{
    return localPrompt(target);
  }
}

async function generateToast(target, roasts){
  try{
    const { content } = await chat([
      { role:'user', content: `Players roasted ${target} with these short lines: ${JSON.stringify(roasts)}. Write one sincere, uplifting compliment (1 line). Return only the compliment.` }
    ], { timeoutMs: 10000 });
    const line = (content||'').trim().replace(/^"|"$/g,'');
    return line || localToast(target);
  }catch{
    return localToast(target);
  }
}

async function generateSummary(target, roasts){
  try{
    const list = Array.isArray(roasts)? roasts : [];
    const { content } = await chat([
      { role:'user', content: `Players roasted ${target} with these short lines: ${JSON.stringify(list)}. Write a single short, witty but kind summary line that highlights 1–2 playful themes (no harshness). Return only the summary.` }
    ], { timeoutMs: 8000 });
    const line = (content||'').trim().replace(/^"|"$/g,'');
    return line || `Playful jabs landed — all in good spirits for ${target}!`;
  }catch{
    return `Playful jabs landed — all in good spirits for ${target}!`;
  }
}

module.exports = { generateRoastPrompt, generateToast, generateSummary };

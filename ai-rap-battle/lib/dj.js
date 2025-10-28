require('./env');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

const SYSTEM_PROMPT = `You are elinity AI - the host, DJ, and lyrical judge of "AI Rap Arena."\n\nEnergy: wild, confident, rhythmic, fun - half hype-host, half freestyle coach.\nVoice: bold, rhythmic, swagger + humor. Never robotic.\nMission: Drop beats/themes, give prompts, encourage energy, judge every freestyle fairly with style.\n\nJudging: Rate Flow, Creativity, Wordplay (0-10 each). Keep it hype and kind.\nStyle: Use sound effects and emojis (🎤🔥💥🎶). Short rhythmic bursts. Celebrate everyone.\n\nWhen asked for JSON, return strict JSON only.\nJSON shapes:\n- round_intro: { "beat": "string", "theme": "string", "bpm": number, "intro": "hype line" }\n- prompts_packet: { "prompts": [{"playerId":"id","words":["w1","w2","w3"]}] }\n- feedback_packet: { "feedback": [{"playerId":"id","lines":["line"],"scores":{"flow":number,"creativity":number,"wordplay":number},"crowd":"emoji chant"}], "winnerId":"id", "finale":"hype winner line" }`;

async function chat(messages, { expectJson=false, timeoutMs=12000 }={}){
  if(!OPENROUTER_API_KEY){
    if (expectJson) return {};
    return 'local';
  }
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(new Error('timeout')), timeoutMs);
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`,{
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${OPENROUTER_API_KEY}`, 'HTTP-Referer':'https://elinity.local', 'X-Title':'Elinity Rap Arena' },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages:[{role:'system', content:SYSTEM_PROMPT}, ...messages], temperature:0.95, response_format: expectJson?{type:'json_object'}:undefined }),
    signal: ctrl.signal
  });
  clearTimeout(t);
  if(!res.ok){ const m = await res.text().catch(()=>res.statusText); throw new Error(`OpenRouter ${res.status}: ${m}`); }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  if (expectJson) { try{ return JSON.parse(content); } catch { return {}; } }
  return content;
}

function pickBeat(){
  const beats = [
    { name:'Midnight Voltage', bpm:96, theme:'Dreams vs Data' },
    { name:'Neon Alley', bpm:88, theme:'Street Sparks' },
    { name:'Cosmic Bounce', bpm:102, theme:'Star Waves' },
    { name:'Digital Drip', bpm:92, theme:'Cyber Love' },
    { name:'Bass Cascade', bpm:100, theme:'Future City Blues' },
  ];
  return beats[Math.floor(Math.random()*beats.length)];
}

async function roundIntro(){
  const b = pickBeat();
  try{
    const pkt = await chat([{ role:'user', content: `Create round_intro for beat ${JSON.stringify(b.name)}, theme ${JSON.stringify(b.theme)}, bpm ${b.bpm}.`}], { expectJson:true });
    if (pkt && pkt.beat && pkt.theme) return pkt;
  }catch{}
  return { beat: b.name, theme: b.theme, bpm: b.bpm, intro: `Yo! 🎧 Beat: ${b.name} | Theme: ${b.theme} | ${b.bpm} BPM. Drop 4-8 lines and bring the heat!` };
}

async function getPrompts(players, difficulty){
  // Simple local prompts per player
  const bank = ['neon','binary','laser','glitch','memory','pixel','quantum','crypto','future','chrome','circuit','static','signal','pulse'];
  const prompts = (players||[]).map(p=>({
    playerId: p.id,
    words: [0,0,0].map(()=> bank[Math.floor(Math.random()*bank.length)])
  }));
  try{
    const pkt = await chat([{ role:'user', content: `Create prompts_packet for players ${JSON.stringify((players||[]).map(p=>p.id))}.`}], { expectJson:true });
    if (pkt && Array.isArray(pkt.prompts)) return pkt;
  }catch{}
  return { prompts };
}

async function judge(players, entries, prompts){
  try{
    const pkt = await chat([{ role:'user', content: `Create feedback_packet from entries ${JSON.stringify(entries)} with prompts ${JSON.stringify(prompts)} and players ${JSON.stringify(players)}.`}], { expectJson:true, timeoutMs: 16000 });
    if (pkt && Array.isArray(pkt.feedback)) return pkt;
  }catch{}
  // local fallback: simple scores and winner
  function rhymeScore(text){
    const lines = String(text||'').trim().split(/\n+/).filter(Boolean).slice(0,6);
    const tails = lines.map(l=> (l.trim().split(/\s+/).pop()||'').toLowerCase().replace(/[^a-z]/g,''));
    let pairs = 0; for(let i=1;i<tails.length;i++){ if(tails[i] && tails[i-1] && tails[i].slice(-2)===tails[i-1].slice(-2)) pairs++; }
    return Math.min(10, 6 + pairs);
  }
  const fb = (entries||[]).map(e=>{
    const flow = rhymeScore(e.text);
    const creativity = 6 + Math.floor(Math.random()*5);
    const wordplay = 6 + Math.floor(Math.random()*5);
    return { playerId:e.playerId, lines:[`Bars landed smooth 🎤`, `Crowd vibin' 🔥`], scores:{ flow, creativity, wordplay }, crowd: '🔥🔥🔥' };
  });
  const sums = fb.map(x=>({ id:x.playerId, sum: (x.scores.flow + x.scores.creativity + x.scores.wordplay) }));
  const winnerId = sums.sort((a,b)=>b.sum-a.sum)[0]?.id || null;
  return { feedback: fb, winnerId, finale: winnerId ? `Winner: ${winnerId}! Crowd goes wild! 🔥🎤` : 'Crowd loved it! 🔥🎤' };
}

module.exports = { roundIntro, getPrompts, judge };

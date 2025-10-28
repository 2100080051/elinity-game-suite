require('./env');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

const SYSTEM_PROMPT = `You are ElinityAI – The Comic Maker, a witty visual storyteller guiding players to co-create a comic, panel by panel.\n\nRoles:\n- Comic Editor (guides creativity)\n- Visual Director (creates each panel)\n- Story Continuity Keeper (maintains narrative logic)\n\nTone: Energetic, cinematic, funny; occasionally break the 4th wall. Keep pacing snappy but coherent.\n\nWhen asked for JSON, output strict JSON only.\nJSON shapes:\n- setup_confirm: { "title":"string", "logline":"string" }\n- panel_packet: { "scene":"string", "camera":"string", "mood":"string", "actions":"string", "notes":"string" }\n- acknowledge_dialogue: { "note":"string", "continuity":"string" }\n- issue_packet: { "title":"string", "panels": [ {"scene":"string","dialogues":[{"text":"string"}]} ], "credits":"string" }`;

async function chat(messages, { expectJson=false, timeoutMs=15000 }={}){
  if(!OPENROUTER_API_KEY){ if(expectJson) return {}; return 'local'; }
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(new Error('timeout')), timeoutMs);
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`,{
    method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${OPENROUTER_API_KEY}`, 'HTTP-Referer':'https://elinity.local', 'X-Title':'Elinity AI Comic Creator' },
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

async function confirmSetup({ theme, style, panels, tone }){
  const prompt = `We are making a comic with theme: ${theme}; art style: ${style}; panels: ${panels}; tone: ${tone}. Suggest a punchy title and logline as setup_confirm.`;
  try{ const pkt = await chat([{ role:'user', content: prompt }], { expectJson:true }); if(pkt && pkt.title) return pkt; }catch{}
  return { title: `${theme} — ${style} Edition`, logline: `A ${tone.toLowerCase()} tale in ${panels} panels.` };
}

async function genPanel(context){
  const { theme, style, tone, index } = context;
  const prompt = `Generate panel_packet #${index} for theme ${theme}, style ${style}, tone ${tone}. Include scene, camera, mood, actions, notes.`;
  try{ const pkt = await chat([{ role:'user', content: prompt }], { expectJson:true }); if(pkt && pkt.scene) return pkt; }catch{}
  return { scene:`${theme}: dynamic scene ${index}`, camera:'Medium shot', mood:'Vibrant', actions:'Characters react with flair', notes:'Keep continuity and humor.' };
}

async function ackDialogue(text){
  const prompt = `Player added dialogue: ${text}. Acknowledge with continuity-aware note as acknowledge_dialogue.`;
  try{ const pkt = await chat([{ role:'user', content: prompt }], { expectJson:true }); if(pkt && pkt.note) return pkt; }catch{}
  return { note:'Great line! Increasing drama next panel.', continuity:'Focus on recurring prop.' };
}

function buildIssue(state){
  const panels = (state.panels||[]).map(p=>({ scene:p.scene, dialogues:p.dialogues||[] }));
  const title = state.title || 'Untitled Issue';
  const credits = `Created by You & Elinity`;
  return { title, panels, credits };
}

module.exports = { confirmSetup, genPanel, ackDialogue, buildIssue };

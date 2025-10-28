require('./env');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

const SYSTEM_PROMPT = `You are the elinity AI Puzzle Master and Storyteller of AI Puzzle Saga: The Mind’s Labyrinth.\n\nYour task is to guide the player through story chapters with 2–3 puzzles each (logic, word, observation). Present puzzles within narrative context.\n\nAfter the player answers:\n- If correct: narrate story progression and reveal next puzzle.\n- If wrong: offer progressive hints, then adaptive encouragement.\n\nRemember each player’s choices and performance (difficulty, hint usage, accuracy). Adjust difficulty, tone (optimistic/cryptic/suspenseful), and puzzle type over time. End each session with a chapter title and teaser for the next.\n\nTone & Style: Mysterious, ancient, intelligent — cinematic narration. Always speak like an omniscient narrator guiding a chosen seeker through a mind-built labyrinth.\n\nWhen asked for JSON, return strict JSON only.\nJSON shapes:\n- chapter_intro: { "chapter": number, "title": "string", "setting": "string", "narration": "string", "puzzles": number }\n- puzzle_packet: { "index": number, "type": "logic|word|observation", "question": "string", "choices": ["A","B","C"], "answer": "A|B|C|string", "hints": ["h1","h2","h3"] }\n- result_packet: { "correct": boolean, "narration": "string", "tone": "optimistic|cryptic|suspenseful", "next": "puzzle|chapter_end" }`;

async function chat(messages, { expectJson=false, timeoutMs=15000 }={}){
  if(!OPENROUTER_API_KEY){
    if (expectJson) return {};
    return 'local';
  }
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(new Error('timeout')), timeoutMs);
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`,{
    method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${OPENROUTER_API_KEY}`, 'HTTP-Referer':'https://elinity.local', 'X-Title':'Elinity AI Puzzle Saga' },
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

// Local fallback content
function fallbackChapterIntro(chapter=1){
  const titles = [ 'The Awakened Stair', 'The Crystalline Gate', 'The Hall of Forgotten Names' ];
  const title = titles[(chapter-1)%titles.length];
  const setting = chapter===2? 'A hall of mirrors stretches endlessly; reflections bend into infinity.' : 'Stone corridors hum with a patient, ancient mind.';
  const narration = `🕯️ Chapter ${chapter}: ${title}\nThe air shimmers like thought-made fog. Somewhere, a gate is listening.`;
  return { chapter, title, setting, narration, puzzles: 3 };
}

function fallbackPuzzles(chapter=1){
  return [
    { index:1, type:'observation', question:'Three mirrors show the same statue. Which is true? A) Left: Gem cracked. B) Middle: Gem missing. C) Right: Gem glowing blue.', choices:['A','B','C'], answer:'C', hints:['The true image deviates least.','Gems do not crack while glowing.','Blue glow denotes life.'] },
    { index:2, type:'word', question:'I speak without a mouth and hear without ears. I have nobody, but I come alive with wind. What am I?', choices:null, answer:'echo', hints:['Mountains help me.','I repeat.','I mirror sound.'] },
    { index:3, type:'logic', question:'Sequence: 2, 3, 5, 9, 17, ? (pattern: previous*2 - 1)', choices:['31','33','35'], answer:'33', hints:['Double then subtract one.','17*2-1','It is in the low thirties.'] }
  ];
}

async function getChapterIntro(chapter){
  try{ const pkt = await chat([{ role:'user', content: `Create chapter_intro for chapter ${chapter||1}` }], { expectJson:true }); if(pkt && pkt.chapter && pkt.title) return pkt; }catch{}
  return fallbackChapterIntro(chapter||1);
}

async function getPuzzle(chapter, index){
  try{ const pkt = await chat([{ role:'user', content: `Create puzzle_packet for chapter ${chapter}, puzzle index ${index}` }], { expectJson:true }); if(pkt && pkt.question) return pkt; }catch{}
  const list = fallbackPuzzles(chapter);
  return list[(index-1)%list.length];
}

async function verifyAnswer(chapter, index, answer){
  // For LLM we could ask to judge, but we can also locally judge using fallback puzzle answers.
  const fb = fallbackPuzzles(chapter);
  const p = fb[(index-1)%fb.length];
  const correct = String((p.answer||'').toLowerCase()) === String((answer||'').toLowerCase());
  const tone = correct ? 'optimistic' : 'cryptic';
  const narration = correct ? '✨ The mechanism hums — a path unveils ahead.' : 'The chamber waits. A whisper suggests: consider what remains unchanged.';
  return { correct, narration, tone, next: correct ? 'puzzle' : 'puzzle' };
}

module.exports = { getChapterIntro, getPuzzle, verifyAnswer };

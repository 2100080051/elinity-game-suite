import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3035;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index', { title: 'Elinity • Emotion Labyrinth' });
});

// CORS-enabled discovery of API endpoints for external integrations
function setCors(res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

app.options('/api/endpoints', (req, res) => { setCors(res); return res.status(204).end(); });
app.get('/api/endpoints', (req, res) => {
  try{
    setCors(res);
    const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
    const proto = req.headers['x-forwarded-proto'] || (String(host).includes('localhost') ? 'http' : 'https');

    // Introspect express router to list API routes
    const endpoints = [];
    const stack = app._router?.stack || [];
    for(const layer of stack){
      if(!layer.route) continue;
      const path = layer.route.path;
      if(typeof path !== 'string' || !path.startsWith('/api')) continue;
      const methods = Object.keys(layer.route.methods||{}).filter(Boolean).map(m=>m.toUpperCase());
      // Prefer common single method, default to GET if none reported
      const method = methods[0] || 'GET';
      if(path !== '/api/endpoints') endpoints.push({ method, path });
    }
    endpoints.sort((a,b)=> a.path.localeCompare(b.path));

    res.status(200).json({
      service: 'Elinity – Emotion Labyrinth (Node)',
      apiBase: '/api',
      baseUrl: `${proto}://${host}`,
      count: endpoints.length,
      endpoints,
    });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/labyrinth', async (req, res) => {
  const { OPENROUTER_API_KEY, OPENROUTER_MODEL, APP_URL } = process.env;
  const useAI = !!(OPENROUTER_API_KEY && OPENROUTER_MODEL);
  const { action, payload } = req.body || {};

  const SYSTEM = `You are ElinityAI, a gentle, poetic guide for Emotion Labyrinth.

Rules and style:
- Tone: mystical, calming, compassionate; avoid clinical or harsh language.
- Brevity with depth: keep responses evocative and concise.
- Imagery: nature, light, water, wind, glow, dusk, moon, starlight.
- Never include backticks or markdown code fences.
- JSON only in the response body, matching the schema for the requested action.

Schemas by action:
- init -> { rooms: string[], room: string }
- describe -> { name: string, description: string, questions: string[] }
- reflect -> { artifact: { name: string, symbol?: string, icon?: string, blessing?: string } }
- navigate -> { room: string }
- summary -> { summary: string }

Content guidance:
- describe: Offer a 1-3 sentence vivid scene for the given room/emotion and 1-2 reflective questions.
- reflect: Create a symbolic artifact. Vary names across emotions (not always the same). Add a unicode symbol if it fits.
- navigate: Suggest a next room key (string) when moving from one emotion to another.
- summary: Provide a short, uplifting summary of the journey.
`;
  const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT ? `${process.env.SYSTEM_PROMPT}\n\n${SYSTEM}` : SYSTEM;

  function artifactForEmotion(emotion, reflection=''){
    const table = {
      gratitude: [
        { name: 'Amber of Thanks', symbol: '🧡' },
        { name: 'Honeyed Sunleaf', symbol: '🍃' },
        { name: 'Cup of Warm Bells', symbol: '🔔' },
      ],
      joy: [
        { name: 'Lark’s Feather', symbol: '🪶' },
        { name: 'Spark of Dawn', symbol: '✨' },
        { name: 'Laughing Pebble', symbol: '🪨' },
      ],
      calm: [
        { name: 'Silver Driftstone', symbol: '🪽' },
        { name: 'Mist Lantern', symbol: '🏮' },
        { name: 'Stillwater Shell', symbol: '🐚' },
      ],
      fear: [
        { name: 'Coal of Courage', symbol: '🔥' },
        { name: 'Nightglass Charm', symbol: '🗝️' },
        { name: 'Moon-Thread', symbol: '🌙' },
      ],
      nostalgia: [
        { name: 'Pressed Memory Leaf', symbol: '🍂' },
        { name: 'Old Key of Echoes', symbol: '🗝️' },
        { name: 'Dustlight Ribbon', symbol: '🎗️' },
      ],
      wonder: [
        { name: 'Star Bead', symbol: '🔮' },
        { name: 'Aurora Pin', symbol: '🌌' },
        { name: 'Comet Thread', symbol: '☄️' },
      ],
      regret: [
        { name: 'Pearl of Release', symbol: '🤍' },
        { name: 'Soft Ash Medal', symbol: '🪙' },
        { name: 'Rain-Washed Note', symbol: '🎵' },
      ],
      courage: [
        { name: 'Lion’s Whisper', symbol: '🦁' },
        { name: 'Braided Resolve', symbol: '🧵' },
        { name: 'Dawn Step', symbol: '🌅' },
      ],
    };
    const list = table[emotion] || [ { name:'Wandering Token', symbol:'💠' } ];
    const item = list[Math.floor(Math.random()*list.length)];
    return { ...item, blessing: reflection ? `A token honoring: ${reflection.slice(0,120)}` : undefined };
  }

  function offline(action, p){
    if(action==='init') return { rooms:['gratitude','joy','calm'], room:(p?.start||'gratitude') };
    if(action==='describe') return { name: nameOf(p?.room||'gratitude'), description: descOf(p?.room||'gratitude'), questions: ['What do you notice here?', 'What soft detail calls you closer?'] };
    if(action==='reflect') return { artifact: artifactForEmotion(p?.room||'gratitude', p?.reflection||'') };
    if(action==='navigate') return { room: p?.direction||'joy' };
    if(action==='summary') return { summary: 'You moved through feeling and light; what you carry now is gentleness with yourself.' };
    return { ok:true }
  }
  function nameOf(k){ return ({gratitude:'The Garden of Gratitude', joy:'The Fountain of Joy', calm:'The Chamber of Calm'})[k]||'The Garden of Gratitude' }
  function descOf(k){ return ({gratitude:'Sunlight pours like honey.', joy:'Warm bells ripple like water.', calm:'Silver mist settles softly.'})[k]||'Sunlight pours like honey.' }

  if(!useAI){ return res.status(200).json(offline(action, payload)); }

  try{
  const messages = [ { role:'system', content: SYSTEM_PROMPT }, { role:'user', content: JSON.stringify({ action, payload }) } ];
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:'POST',
      headers:{
        'Authorization':`Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type':'application/json',
        'HTTP-Referer': APP_URL || `http://localhost:${PORT}`,
        'X-Title': 'Emotion Labyrinth (Node)'
      },
      body: JSON.stringify({ model: OPENROUTER_MODEL, messages, temperature: 0.9, top_p: 0.95, response_format: { type:'json_object' } })
    });
    const raw = await r.json();
    const text = raw?.choices?.[0]?.message?.content || '';
    const cleaned = String(text).replace(/^```json\n?|```$/g,'').trim();
    let data = null; try{ data = JSON.parse(cleaned) }catch{ const m = cleaned.match(/\{[\s\S]*\}/); if(m){ try{ data = JSON.parse(m[0]) }catch(_){} } }
    return res.status(200).json(data || offline(action, payload));
  }catch(err){
    console.error('OpenRouter error', err);
    return res.status(200).json(offline(action, payload));
  }
});

app.listen(PORT, () => {
  const { OPENROUTER_API_KEY, OPENROUTER_MODEL } = process.env;
  const aiOn = !!(OPENROUTER_API_KEY && OPENROUTER_MODEL);
  console.log(`Emotion Labyrinth (Node) listening on http://localhost:${PORT}`);
  console.log(`AI: ${aiOn ? `ON (model=${OPENROUTER_MODEL})` : 'OFF (using offline fallback)'}`);
});

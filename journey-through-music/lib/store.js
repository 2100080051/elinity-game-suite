import { chat, SYSTEM_PROMPT, stripFences, parseJsonLoose } from './openrouter';

const globalAny = globalThis;
if (!globalAny.__JTM_STORE__) {
  globalAny.__JTM_STORE__ = { sessions: new Map(), history: [] };
}
const store = globalAny.__JTM_STORE__;

function rid() { return Math.random().toString(36).slice(2, 10); }
function clamp01(n) { return Math.max(0, Math.min(1, n)); }

function localScene(seed, mood) {
  // simple deterministic-ish seed
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  function rnd() { h = (1103515245 * h + 12345) % 2147483647; return (h & 0x7fffffff) / 2147483647; }
  const palettes = {
    calm: ['#0ea5e9','#22d3ee','#a5b4fc','#c7d2fe'],
    joyful: ['#fde68a','#fca5a5','#7dd3fc','#a7f3d0'],
    dreamy: ['#a78bfa','#93c5fd','#fbcfe8','#bbf7d0']
  };
  const palette = (palettes[mood] || palettes.calm).slice(0, 4);
  const elements = Array.from({ length: 14 }, () => ({
    type: ['orb','leaf','wave','spark'][Math.floor(rnd()*4)],
    x: rnd(), y: rnd(), size: rnd()*0.8 + 0.2, opacity: rnd()*0.6 + 0.3
  }));
  return {
    title: `${mood[0].toUpperCase()+mood.slice(1)} Soundscape`,
    palette,
    elements,
    narration: 'Let the music paint the air. Breathe in, and watch the lights drift.',
    suggestions: ['breathe','bloom','rain']
  };
}

export async function startSession({ playlistUrl, mood='calm' }) {
  const id = Date.now().toString(36) + rid();
  const base = {
    id,
    createdAt: Date.now(),
    mood,
    tempo: 'medium',
    emotion_tags: [],
    playlistUrl: playlistUrl || '',
    tick: 0,
    scene: null,
    meditation: false,
    log: [],
    history: [],
    summary: null
  };

  // Try AI scene; otherwise fallback
  // Analyze + initial scene
  const analyzed = await analyzeMusicInternal({ playlistUrl, suggestMood: mood });
  base.mood = analyzed.mood;
  base.tempo = analyzed.tempo;
  base.emotion_tags = analyzed.emotion_tags;

  let scene = await generateSceneInternal({ id, mood: base.mood, tempo: base.tempo, emotion_tags: base.emotion_tags });
  if (!scene) scene = localScene(id + (playlistUrl || ''), base.mood);

  base.scene = normalizeScene(scene, base);
  base.log.push({ t: Date.now(), type: 'start', note: `Session started with mood ${base.mood}, tempo ${base.tempo}` });
  base.history.push({ tick: 0, scene: base.scene });
  store.sessions.set(id, base);
  store.history.unshift({ id, createdAt: base.createdAt, mood: base.mood, title: base.scene.title });
  store.history = store.history.slice(0, 50);
  return base;
}

export function getSession(id) {
  return store.sessions.get(id) || null;
}

export async function tickSession(id) {
  const s = store.sessions.get(id);
  if (!s) return null;
  s.tick += 1;
  if (s.meditation) return s; // keep calm; no AI changes during meditation
  // Gentle evolve elements
  s.scene.elements = s.scene.elements.map((el, i) => {
    const n = { ...el };
    const t = (Math.sin((s.tick + i) * 0.35) + 1) / 2;
    n.opacity = clamp01(el.opacity * 0.9 + t * 0.15);
    n.x = clamp01(el.x + (Math.sin((s.tick + i) * 0.07) * 0.01));
    n.y = clamp01(el.y + (Math.cos((s.tick + i) * 0.06) * 0.01));
    return n;
  });
  if (s.tick % 8 === 0) {
    // occasionally update narration via AI, otherwise small local tweak
    const aiText = await chat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Evolve the world one step. Input: mood=${s.mood}, tempo=${s.tempo}, tags=${s.emotion_tags.join(',')}. Prior narration: ${s.scene.narration}. Return full JSON.` }
    ]);
    if (aiText) {
      const parsed = parseJsonLoose(stripFences(aiText));
      if (parsed) s.scene = normalizeScene({ ...s.scene, ...parsed }, s);
    } else {
      s.scene.narration = ['Drift with the tide of sound.','A soft glow hums beneath the surface.','Breathe in; the colors respond.'][s.tick % 3];
      if (!s.scene.choices?.length) s.scene.choices = ['Follow the melody north','Sit and listen beneath the willow','Let the rhythm guide your steps'];
    }
    s.history.push({ tick: s.tick, scene: s.scene });
    s.history = s.history.slice(-25);
  }
  return s;
}

export function commandSession(id, command) {
  const s = store.sessions.get(id);
  if (!s) return null;
  const c = (command || '').toLowerCase();
  if (c === 'breathe') {
    s.scene.elements = s.scene.elements.map(e => ({ ...e, size: clamp01(e.size * 0.95 + 0.08) }));
    s.scene.narration = 'Inhale. The orbs expand as your breath deepens.';
  } else if (c === 'bloom') {
    s.scene.elements.push({ type: 'leaf', x: Math.random(), y: Math.random(), size: 0.6, opacity: 0.8 });
    s.scene.narration = 'Petals of light unfold at the edges.';
  } else if (c === 'rain') {
    s.scene.elements = s.scene.elements.map(e => e.type === 'wave' ? { ...e, opacity: clamp01(e.opacity + 0.2) } : e);
    s.scene.narration = 'A gentle rain passes through, leaving ripples.';
  } else if (c === 'meditate_on') {
    s.meditation = true;
    s.scene.narration = 'You slip into quiet presence. The world breathes softly.';
  } else if (c === 'meditate_off') {
    s.meditation = false;
    s.scene.narration = 'You return to the path. The air brightens to greet you.';
  } else {
    s.scene.narration = `The world listens: "${command}".`;
  }
  if (!s.scene.suggestions?.length) s.scene.suggestions = ['breathe','bloom','rain'];
  return s;
}

export function getState() {
  return { sessions: store.history };
}

// New: Richer AI flows per spec
export async function analyzeMusicInternal({ playlistUrl, suggestMood='calm' }) {
  const base = { mood: suggestMood || 'calm', tempo: 'medium', emotion_tags: ['serene','warm'] };
  const text = await chat([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Analyze track/playlist (url: ${playlistUrl || 'none'}). Return JSON with mood, tempo, emotion_tags. Keep it concise.` }
  ]);
  if (!text) return base;
  const parsed = parseJsonLoose(stripFences(text));
  if (!parsed) return base;
  return {
    mood: parsed.mood || base.mood,
    tempo: parsed.tempo || base.tempo,
    emotion_tags: parsed.emotion_tags || base.emotion_tags,
  };
}

export async function generateSceneInternal({ id, mood, tempo, emotion_tags }) {
  const prompt = `Generate initial world and narration for mood=${mood}, tempo=${tempo}, tags=${(emotion_tags||[]).join(',')}. Return full JSON schema.`;
  const text = await chat([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ]);
  if (!text) return null;
  const parsed = parseJsonLoose(stripFences(text));
  return parsed || null;
}

export async function applyPlayerChoiceInternal(id, choice) {
  const s = store.sessions.get(id);
  if (!s) return null;
  s.log.push({ t: Date.now(), type: 'choice', choice });
  const text = await chat([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Player chose: ${choice}. Prior world title: ${s.scene.title}. Mood=${s.mood}, tempo=${s.tempo}. Evolve the scene and return full JSON.` }
  ]);
  if (text) {
    const parsed = parseJsonLoose(stripFences(text));
    if (parsed) s.scene = normalizeScene({ ...s.scene, ...parsed }, s);
  } else {
    // local nudge fallback
    s.scene.narration = `${s.scene.narration} You ${choice.toLowerCase()}.`;
    if (!s.scene.choices?.length) s.scene.choices = ['Follow the rising beat','Sit by the glowing ridge','Shift to staccato rhythm'];
  }
  return s;
}

export async function reflectInternal(id, textInput) {
  const s = store.sessions.get(id);
  if (!s) return null;
  s.log.push({ t: Date.now(), type: 'reflect', text: textInput });
  const text = await chat([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Player reflection: ${textInput}. Respond with empathetic poetry (narration field) and subtle world adjustment, full JSON.` }
  ]);
  if (text) {
    const parsed = parseJsonLoose(stripFences(text));
    if (parsed) s.scene = normalizeScene({ ...s.scene, ...parsed }, s);
  } else {
    s.scene.narration = `${s.scene.narration} A quiet understanding settles in the air.`;
  }
  return s;
}

export async function endSessionInternal(id) {
  const s = store.sessions.get(id);
  if (!s) return null;
  const text = await chat([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Summarize this journey as a closing reflection. Mood=${s.mood}, tempo=${s.tempo}, tags=${s.emotion_tags.join(',')}. Return JSON with narration as poetic summary and world finalization.` }
  ]);
  let summary = 'The music fades, but the landscape lingers — alive in rhythm and light.';
  if (text) {
    const parsed = parseJsonLoose(stripFences(text));
    if (parsed?.narration) summary = parsed.narration;
    if (parsed?.world) s.scene = normalizeScene({ ...s.scene, ...parsed }, s);
  }
  s.summary = summary;
  s.log.push({ t: Date.now(), type: 'end', summary });
  return s;
}

function normalizeScene(scene, s) {
  // merge schema fields while preserving local element shape
  const palette = scene.palette || scene.world?.palette || s?.scene?.palette || ['#7dd3fc','#a5b4fc','#fde68a'];
  const elementsRaw = scene.elements || scene.world?.elements || s?.scene?.elements || [];
  const elements = elementsRaw.map((e) => {
    // support either {type,x,y,intensity} or our older {type,x,y,size,opacity}
    if (e.intensity != null) return { type: e.type || 'orb', x: clamp01(e.x||0.5), y: clamp01(e.y||0.5), size: clamp01(e.intensity*0.8 + 0.2), opacity: clamp01(e.intensity*0.7 + 0.3) };
    return { type: e.type || 'orb', x: clamp01(e.x||0.5), y: clamp01(e.y||0.5), size: clamp01((e.size??0.6)), opacity: clamp01((e.opacity??0.8)) };
  });
  const title = scene.title || scene.world?.title || s?.scene?.title || 'Soundscape';
  const narration = scene.narration || s?.scene?.narration || 'Breathe. Watch the world respond.';
  const choices = scene.choices || ['Follow the rising beat','Sit by the glowing ridge','Shift to staccato rhythm'];
  return { title, palette, elements, narration, choices };
}

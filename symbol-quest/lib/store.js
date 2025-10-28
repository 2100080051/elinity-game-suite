const { generateScene, interpretChoice } = require('./openrouter');

const store = globalThis.__symbolQuest || { games: new Map() };
if (!globalThis.__symbolQuest) globalThis.__symbolQuest = store;

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

function getOrCreateGame(id) {
  let g = store.games.get(id);
  if (!g) {
    g = { id, createdAt: Date.now(), scenes: [], current: null, steps: 0, targetSteps: 4 + Math.floor(Math.random()*3), ended: false, path: [], finalInsight: null, history: [] };
    store.games.set(id, g);
  }
  return g;
}

async function startGame() {
  const id = uid();
  const game = getOrCreateGame(id);
  const sceneData = await generateScene({ pathSummary: '' });
  game.current = { text: sceneData.scene, choices: sceneData.choices };
  return { id: game.id };
}

function getState(id) {
  const g = getOrCreateGame(id);
  return {
    id: g.id,
    steps: g.steps,
    ended: g.ended,
    current: g.current,
    path: g.path,
    finalInsight: g.finalInsight
  };
}

async function chooseAction(id, index) {
  const g = getOrCreateGame(id);
  if (g.ended) return { error: 'Game ended' };
  const choice = g.current?.choices?.[index];
  if (!choice) return { error: 'Invalid choice' };
  const sceneText = g.current.text;
  const pathSummary = g.path.map(p => `${p.scene} -> ${p.choice}`).join(' | ');
  const outcome = await interpretChoice({ scene: sceneText, choice, pathSummary });
  g.scenes.push({ scene: sceneText, choices: g.current.choices });
  g.path.push({ scene: sceneText, choice, outcome });
  return { outcome };
}

async function continueScene(id) {
  const g = getOrCreateGame(id);
  if (g.ended) return getState(id);
  g.steps += 1;
  if (g.steps >= g.targetSteps) {
    // end game 4-6 scenes
    const insight = await buildFinalInsight(g);
    g.finalInsight = insight;
    g.ended = true;
    g.current = null;
    return getState(id);
  }
  const pathSummary = g.path.map(p => `${p.scene} -> ${p.choice}`).join(' | ');
  const sceneData = await generateScene({ pathSummary });
  g.current = { text: sceneData.scene, choices: sceneData.choices };
  return getState(id);
}

async function buildFinalInsight(g) {
  const summary = g.path.map((p, i) => `${i+1}. ${p.choice}`).join('; ');
  const prompt = `In 2-3 short luminous lines, summarize the path taken (${summary}) and offer a closing symbolic gift/insight. Keep it calm, positive, and metaphor-rich.`;
  try {
    // reuse interpretChoice chat path for simplicity
    const { chat } = require('./openrouter');
    const text = await chat([{ role: 'user', content: prompt }]);
    return String(text || '').trim();
  } catch {
    return 'You have learned to trust the hush between heartbeats. The path opens like a lantern in your hands.';
  }
}

function endGame(id) {
  const g = getOrCreateGame(id);
  g.ended = true;
  return getState(id);
}

function saveReflection(id) {
  const g = getOrCreateGame(id);
  if (!g.finalInsight) return { ok: false, error: 'No reflection to save yet.' };
  const entry = { id: uid(), createdAt: Date.now(), insight: g.finalInsight, path: g.path };
  g.history.unshift(entry);
  return { ok: true, entry };
}

module.exports = { startGame, getState, chooseAction, continueScene, endGame, saveReflection };

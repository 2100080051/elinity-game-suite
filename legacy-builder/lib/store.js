const store = globalThis.__legacy || { legacies: new Map() };
if (!globalThis.__legacy) globalThis.__legacy = store;
const { newGenerationPacket, summarizeGeneration } = require('./storykeeper');

function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-3); }

function listLegacies(){
  return Array.from(store.legacies.values()).map(l => ({ id:l.id, name:l.name, generation:l.generation, updatedAt:l.updatedAt }));
}

function newLegacy(name){
  const id = uid();
  const legacy = { id, name: String(name||'Unnamed Legacy').slice(0,60), generation: 1, history: [], artifacts: [], journal: [], lastPacket: null, lastSummary: '', updatedAt: Date.now() };
  store.legacies.set(id, legacy);
  return { id, name: legacy.name };
}

function getState(id){
  const l = store.legacies.get(id);
  if (!l) throw new Error('No legacy');
  return { id:l.id, name:l.name, generation:l.generation, history:l.history.slice(-5), artifacts:l.artifacts.slice(-12), journal:l.journal.slice(-20), packet:l.lastPacket, summary:l.lastSummary, updatedAt:l.updatedAt };
}

async function nextPrompt(id){
  const l = store.legacies.get(id); if(!l) throw new Error('No legacy');
  const packet = await newGenerationPacket({ name:l.name, generation:l.generation, lastSummary:l.lastSummary, artifacts:l.artifacts.slice(-6) });
  l.lastPacket = packet;
  l.updatedAt = Date.now();
  return getState(id);
}

function addJournal(id, text){
  const l = store.legacies.get(id); if(!l) throw new Error('No legacy');
  const line = String(text||'').trim().slice(0,400);
  if (!line) return getState(id);
  l.journal.push({ text: line, at: Date.now() });
  l.updatedAt = Date.now();
  return getState(id);
}

async function finalizeGeneration(id){
  const l = store.legacies.get(id); if(!l) throw new Error('No legacy');
  const packet = l.lastPacket || {};
  const entry = {
    generation: l.generation,
    era: packet.era||'', heir: packet.heir||'', conflict: packet.conflict||'', lesson: packet.lesson||'',
    artifacts: Array.isArray(packet.artifacts)? packet.artifacts: []
  };
  l.history.push(entry);
  (entry.artifacts||[]).forEach(a=> l.artifacts.push({ name:a, gen:l.generation }));
  l.lastSummary = await summarizeGeneration({ name:l.name, entry, journal:l.journal.slice(-10) });
  l.generation += 1;
  l.lastPacket = null;
  l.updatedAt = Date.now();
  return getState(id);
}

module.exports = { listLegacies, newLegacy, getState, nextPrompt, addJournal, finalizeGeneration };

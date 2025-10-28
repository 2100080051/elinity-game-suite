const { randomUUID } = require('crypto');

/** In-memory store for artifacts (ephemeral, per-process). */
const _state = {
  artifacts: new Map(), // id -> artifact
};

function id() { return randomUUID(); }

/**
 * @typedef {Object} Artifact
 * @property {string} id
 * @property {string} name
 * @property {string} title
 * @property {string} description
 * @property {string} reflection
 * @property {string} imagePrompt
 * @property {string|undefined} imageUrl
 * @property {string} createdAt
 * @property {any} meta
 */

/**
 * Save artifact to store.
 * @param {Omit<Artifact,'id'|'createdAt'>} a
 * @returns {Artifact}
 */
function saveArtifact(a) {
  const art = { ...a, id: id(), createdAt: new Date().toISOString() };
  _state.artifacts.set(art.id, art);
  return art;
}

/** @returns {Artifact[]} */
function listArtifacts() {
  return Array.from(_state.artifacts.values()).sort((a,b)=> (a.createdAt < b.createdAt ? 1 : -1));
}

/** @param {string} artId */
function getArtifact(artId) { return _state.artifacts.get(artId) || null; }

/** @param {string} artId */
function deleteArtifact(artId) { return _state.artifacts.delete(artId); }

module.exports = { saveArtifact, listArtifacts, getArtifact, deleteArtifact };

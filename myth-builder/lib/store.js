const { randomUUID } = require('crypto');

const state = {
  legends: new Map(), // id -> Legend
};

function id() { return randomUUID(); }

/**
 * @typedef {Object} Legend
 * @property {string} id
 * @property {string} title
 * @property {string} world
 * @property {string[]} authors
 * @property {string[]} characters
 * @property {Array<{round:number, text:string, votes?:number}>} rounds
 * @property {string} climax
 * @property {string} moral
 * @property {string} createdAt
 */

function saveLegend(l) {
  const legend = { ...l, id: id(), createdAt: new Date().toISOString() };
  state.legends.set(legend.id, legend);
  return legend;
}

function listLegends() {
  return Array.from(state.legends.values()).sort((a,b)=> (a.createdAt < b.createdAt ? 1 : -1));
}

function getLegend(id) { return state.legends.get(id) || null; }

function deleteLegend(id) { return state.legends.delete(id); }

module.exports = { saveLegend, listLegends, getLegend, deleteLegend };

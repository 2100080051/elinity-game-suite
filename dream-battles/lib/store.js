// In-memory store for cards, battles, and leaderboard
const state = {
  cards: new Map(), // id -> card
  order: [], // array of ids (recent first)
  scores: new Map(), // player -> points
};

let seq = 1;

export function saveCard(card) {
  const id = String(seq++);
  const withId = { id, ...card };
  state.cards.set(id, withId);
  state.order.unshift(id);
  return withId;
}

export function listCards() {
  return state.order.map((id) => state.cards.get(id));
}

export function getCard(id) {
  return state.cards.get(String(id));
}

export function deleteCard(id) {
  const existed = state.cards.delete(String(id));
  state.order = state.order.filter((x) => x !== String(id));
  return existed;
}

export function addPoint(player) {
  const current = state.scores.get(player) || 0;
  const next = current + 1;
  state.scores.set(player, next);
  return next;
}

export function getScores() {
  return Array.from(state.scores.entries())
    .map(([player, points]) => ({ player, points }))
    .sort((a, b) => b.points - a.points);
}

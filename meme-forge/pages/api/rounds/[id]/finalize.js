import { getRound, saveRound } from '../../../../lib/store';

function tallyVotes(votes){
  const map = new Map();
  for (const v of votes) map.set(v.meme_id, (map.get(v.meme_id)||0) + (v.delta||0));
  return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]);
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { id } = req.query;
    const r = getRound(id);
    if (!r) return res.status(404).json({ error: 'Round not found' });

    const tallied = tallyVotes(r.votes);
    const top = tallied[0];
    const winner = top ? { meme_id: top[0], score: top[1] } : null;
    r.winner = winner;
    saveRound(r);

    const leaderboard = tallied.map(([meme_id, score]) => ({ meme_id, score }));
    const md = `## Prompt\n${r.prompt.image_idea} — ${r.prompt.seed_phrase}\n\n## Captions\n${r.captions.map(c=>`- ${c.text}`).join('\n') || '(none)'}\n\n## Meme Gallery\n${r.memes.map(m=>`- ${m.id}`).join('\n') || '(empty)'}\n\n## Voting\n${r.votes.length} votes cast.\n\n## Results\n${winner ? `Winner: ${winner.meme_id} (score ${winner.score})` : 'No winner'}\n`;

    return res.status(200).json({ round_id: r.id, winner, leaderboard, markdown: md });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}

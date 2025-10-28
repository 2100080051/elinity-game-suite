import { getRound, saveRound } from '../../../../lib/store';
import { memeSVG } from '../../../../lib/svg';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { id } = req.query;
    const r = getRound(id);
    if (!r) return res.status(404).json({ error: 'Round not found' });

    const { text = '', author = '' } = (req.body || {});
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Missing caption text' });

    const capId = `${r.id}-c${r.captions.length + 1}`;
    r.captions.push({ id: capId, text, author });
    const memeId = `${r.id}-m${r.memes.length + 1}`;
    const url = memeSVG({ image_idea: r.prompt.image_idea, seed_phrase: r.prompt.seed_phrase, caption: text });
    r.memes.push({ id: memeId, caption_id: capId, url });
    saveRound(r);

    return res.status(201).json({ round_id: r.id, meme: { id: memeId, caption_id: capId, url }, captions: r.captions, memes: r.memes });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err.message || String(err) });
  }
}

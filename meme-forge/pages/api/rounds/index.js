import { chat, parseJsonLoose } from '../../../lib/openrouter';
import { newRound, listRounds, saveRound } from '../../../lib/store';
import { promptThumbSVG } from '../../../lib/svg';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return res.status(200).json({ rounds: listRounds() });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const sys = `You are the AI Meme Maker for Meme Forge – a fast-paced, collaborative meme-creation tool.
Return ONLY valid, minified JSON. No markdown fences, no commentary.
Return exactly these keys:
{
  "round_id": string,
  "prompt": { "image_idea": string, "seed_phrase": string },
  "captions": [],
  "memes": [],
  "votes": [],
  "winner": null,
  "markdown": string
}
The markdown must contain sections: Prompt, Captions, Meme Gallery, Voting, Results.`;

    const user = `Generate a single prompt for a new round.
Keep the image_idea playful but clear. Keep seed_phrase 1-4 words. Provide a short markdown describing sections; Captions/Meme Gallery/Voting/Results can be placeholders.`;

    const content = await chat([
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ]);

    let payload;
    try { payload = parseJsonLoose(content); } catch (e) {
      const fmt = await chat([
        { role: 'system', content: 'You are a JSON reformatter. Output only valid, minified JSON. Do not add or remove keys.' },
        { role: 'user', content: `Fix and return ONLY JSON: ${content}` },
      ], { temperature: 0 });
      payload = parseJsonLoose(fmt);
    }

    const base = newRound();
    const image_idea = payload?.prompt?.image_idea || 'Funny Cat';
    const seed_phrase = payload?.prompt?.seed_phrase || 'Monday vibes';
    base.prompt = { image_idea, seed_phrase, thumb: promptThumbSVG({ image_idea, seed_phrase }) };
    saveRound(base);

    const md = payload?.markdown || `## Prompt\n${image_idea} — ${seed_phrase}\n\n## Captions\n(none yet)\n\n## Meme Gallery\n(empty)\n\n## Voting\nStarts when everyone submits.\n\n## Results\n–`;

    return res.status(201).json({
      round_id: base.id,
      prompt: base.prompt,
      captions: [],
      memes: [],
      votes: [],
      winner: null,
      markdown: md,
    });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err.message || String(err) });
  }
}

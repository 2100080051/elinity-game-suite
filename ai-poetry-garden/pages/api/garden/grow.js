import { chat, parseJsonLoose, SYSTEM_PROMPT } from '../../../lib/openrouter';
import { savePoems, getRound } from '../../../lib/store';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const { round_number } = req.body||{};
    if(!round_number) return res.status(400).json({error:'round_number required'});

    const existing = getRound(Number(round_number));
    if(!existing) return res.status(404).json({error:'Round not found'});

    const sys = { role:'system', content: `${SYSTEM_PROMPT}\nReturn JSON only with {poems:[{seed_id, poem, visual_text, image_url, tags}]}. Keep poems 4-8 lines.` };
    const payload = {
      round_number: existing.round_number,
      seeds: existing.seeds.map(s=> ({ seed_id: s.seed_id, player_id: s.player_id, seed_text: s.seed_text }))
    };
    const user = { role:'user', content: JSON.stringify(payload) };

    let poems = [];
    try{
      const content = await chat([sys, user], { json: true });
      const parsed = parseJsonLoose(content) || {};
      if(Array.isArray(parsed.poems)) poems = parsed.poems;
    }catch(e){ /* ignore and fallback */ }
    if(!poems.length){
      // Fallback local generation for demo/dev when AI key missing
      poems = existing.seeds.map(s=> ({
        seed_id: s.seed_id,
        poem: `${s.seed_text}\nA tender sprout becomes a rhyme,\nUnder pixel stars and time,\nSoil of dreams, rain of light,\nRoots remember, leaves take flight.`,
        visual_text: 'pixel garden sprout, soft glow, pastel dawn',
        image_url: null,
        tags: ['gentle','garden','pixel-art']
      }));
    }

    const round = savePoems(Number(round_number), poems);
    if(!round) return res.status(404).json({error:'Round not found'});

    return res.status(200).json({ round });
  }catch(e){ return res.status(500).json({ error: e.message||'Server error' }); }
}

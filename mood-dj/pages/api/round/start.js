import { chat, parseJsonLoose } from '../../../lib/openrouter';
import { startRound, saveRound } from '../../../lib/store';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const { player_moods=[] } = req.body||{};
    if(!Array.isArray(player_moods) || player_moods.length===0) return res.status(400).json({error:'player_moods required'});

    const round = startRound({ player_moods });

    // Ask model to generate track set for unique moods
    const unique = Array.from(new Set(player_moods.map(p=> p.mood)));
    const sys = { role:'system', content: `${process.env.SYSTEM_PROMPT||''}\nReturn JSON only for track_set: [{track_id, mood, emoji, audio_url, visual_url}] for moods: ${unique.join(', ')}` };
    const user = { role:'user', content: JSON.stringify({ round_id: round.id, moods: unique }) };

    let content; try{ content = await chat([sys, user], { json: true }); }catch(e){ content = '{}'; }
    const parsed = parseJsonLoose(content) || {};
    round.track_set = Array.isArray(parsed.track_set)? parsed.track_set : unique.map((m,i)=> ({
      track_id: `${round.id}-${i+1}`,
      mood: m,
      emoji: moodEmoji(m),
      audio_url: '',
      visual_url: ''
    }));

    saveRound(round);
    return res.status(200).json({ round });
  }catch(e){
    return res.status(500).json({ error: e.message||'Server error' });
  }
}

function moodEmoji(m){
  const map = { happy:'😊', relaxed:'😌', energetic:'⚡', nostalgic:'📼', dreamy:'💫', edgy:'🗡️', curious:'🧠' };
  return map[m] || '🎵';
}

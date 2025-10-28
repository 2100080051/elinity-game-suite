import { chat } from '../../../lib/openrouter';
import { saveArtifact, listArtifacts } from '../../../lib/store';

const SYSTEM = `You are ElinityAI, the artistic visionary of "Future Artifact Maker" — a playful reflection game where imagination meets foresight.

STYLE:
- Tone: Encouraging, wonder-filled, reflective.
- Language: Artistic, descriptive, emotionally resonant.
- Encourage creativity and humor — no judgment or realism limits.

OUTPUT STRICTLY AS JSON:
Return a single-line JSON object with keys: name, title, description, reflection, imagePrompt. No code fences. No extra text.`;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.json(listArtifacts());
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { response, prompt, imageRequested = false, save = true, meta = {} } = req.body || {};
    if (!response) return res.status(400).json({ error: 'Missing response' });

    const userMsg = `PLAYER RESPONSE:\n${response}\n\nCONTEXT PROMPT (optional): ${prompt || ''}\n\nTASK: Translate to a rich, imaginative artifact with details (material, texture, glow, smell, symbolic traits). Include a poetic title and a one-line reflective meaning.`;

    const content = await chat([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: userMsg },
    ]);

    // Attempt to parse JSON response. If fails, return 422.
    let parsed;
    try {
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      const jsonSlice = firstBrace >= 0 ? content.slice(firstBrace, lastBrace + 1) : content;
      parsed = JSON.parse(jsonSlice);
    } catch {
      return res.status(422).json({ error: 'Model did not return valid JSON', raw: content });
    }

    const artifactDraft = {
      name: parsed.name || 'Future Artifact',
      title: parsed.title || parsed.name || 'Future Artifact',
      description: parsed.description || String(content).trim(),
      reflection: parsed.reflection || '',
      imagePrompt: parsed.imagePrompt || 'symbolic artifact, cinematic soft light, premium render',
      imageUrl: null,
      meta: { ...meta, imageRequested },
    };

    // Do not generate placeholder images. imageUrl remains null unless a real image API is integrated.

    const final = save ? saveArtifact(artifactDraft) : { ...artifactDraft, id: 'temp', createdAt: new Date().toISOString() };
    res.json(final);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Unexpected error' });
  }
}

// Removed local fallback and placeholder image generation to enforce API-only AI usage.

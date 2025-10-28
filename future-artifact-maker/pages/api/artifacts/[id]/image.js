import { getArtifact } from '../../../../../lib/store';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' });
  const a = getArtifact(id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  // Placeholder endpoint for future image generation integration.
  // For now, return the existing imageUrl or a derived gradient.
  return res.status(501).json({ error: 'Image generation not configured. Provide an AI image API to enable this endpoint.' });
}

function gradientDataUrl(seed) {
  const hash = [...seed].reduce((a,c)=> (a*33 + c.charCodeAt(0))>>>0, 5381);
  const hue1 = hash % 360;
  const hue2 = (hash >> 8) % 360;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='1200'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='hsl(${hue1},70%,55%)'/>
        <stop offset='100%' stop-color='hsl(${hue2},70%,45%)'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}

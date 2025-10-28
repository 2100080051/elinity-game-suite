function esc(s=''){return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}

export function promptThumbSVG({ image_idea, seed_phrase, bg = '#111827', fg = '#ffffff' }){
  const w=800,h=600; const pad=32;
  const idea = esc(image_idea||'Meme Idea');
  const seed = esc(seed_phrase||'Seed phrase');
  return `data:image/svg+xml;utf8,` + encodeURIComponent(
`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#f97316'/>
      <stop offset='100%' stop-color='#22d3ee'/>
    </linearGradient>
  </defs>
  <rect width='100%' height='100%' fill='url(#g)'/>
  <rect x='${pad}' y='${pad}' width='${w-2*pad}' height='${h-2*pad}' rx='24' fill='${bg}' opacity='0.65'/>
  <text x='50%' y='45%' fill='${fg}' font-size='36' font-family='Bebas Neue, Impact, sans-serif' dominant-baseline='middle' text-anchor='middle' opacity='0.9'>${idea}</text>
  <text x='50%' y='60%' fill='${fg}' font-size='20' font-family='system-ui, sans-serif' dominant-baseline='middle' text-anchor='middle' opacity='0.85'>${seed}</text>
</svg>`);
}

export function memeSVG({ image_idea, seed_phrase, caption, bg = '#111827', fg = '#ffffff' }){
  const w=800,h=600; const pad=24;
  const idea = esc(image_idea||'');
  const seed = esc(seed_phrase||'');
  const cap = esc(caption||'');
  return `data:image/svg+xml;utf8,` + encodeURIComponent(
`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#22d3ee'/>
      <stop offset='100%' stop-color='#f97316'/>
    </linearGradient>
    <filter id='stroke'>
      <feMorphology in='SourceAlpha' operator='dilate' radius='2' result='thick'/>
      <feColorMatrix in='thick' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0' result='outline'/>
      <feMerge>
        <feMergeNode in='outline'/>
        <feMergeNode in='SourceGraphic'/>
      </feMerge>
    </filter>
  </defs>
  <rect width='100%' height='100%' fill='url(#g)'/>
  <rect x='${pad}' y='${pad}' width='${w-2*pad}' height='${h-2*pad}' rx='24' fill='${bg}' opacity='0.65'/>
  <text x='50%' y='15%' fill='${fg}' font-size='54' font-family='Impact, Anton, Bebas Neue, sans-serif' dominant-baseline='middle' text-anchor='middle' filter='url(#stroke)'>${cap}</text>
  <text x='50%' y='88%' fill='${fg}' font-size='18' font-family='system-ui, sans-serif' dominant-baseline='middle' text-anchor='middle' opacity='0.85'>${idea} • ${seed}</text>
</svg>`);
}

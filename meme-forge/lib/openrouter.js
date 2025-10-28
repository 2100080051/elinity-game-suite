export async function chat(messages, { model = process.env.OPENROUTER_MODEL, temperature = 0.7 } = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');
  if (!model) throw new Error('Missing OPENROUTER_MODEL');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature }),
  });
  if (!res.ok) { const text = await res.text(); throw new Error(`OpenRouter error: ${res.status} ${text}`); }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content from model');
  return content;
}

function sanitize(s=''){
  // strip code fences and think tags; collapse whitespace
  return s
    .replace(/```[a-z]*\n?[\s\S]*?```/g, (m)=>{
      // try to keep JSON inside fences if present
      const i = m.indexOf('{'); const j = m.lastIndexOf('}');
      return (i>=0 && j>i) ? m.slice(i, j+1) : '';
    })
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/\r?\n/g, ' ')
    .trim();
}

export function parseJsonLoose(s) {
  const t = sanitize(s);
  const i = t.indexOf('{'); const j = t.lastIndexOf('}');
  if (i>=0 && j>i){
    const fragment = t.slice(i, j+1);
    return JSON.parse(fragment);
  }
  throw new Error('Model did not return JSON');
}

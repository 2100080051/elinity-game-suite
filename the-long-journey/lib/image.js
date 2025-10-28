export async function generateImage(prompt) {
  const provider = process.env.IMAGE_PROVIDER;
  if (!provider) { const e=new Error('Image generation not configured'); e.status=501; throw e; }
  const e=new Error(`Image provider '${provider}' not implemented`); e.status=501; throw e;
}

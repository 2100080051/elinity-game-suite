// Pluggable image generation facade. Enforces API-only; no mock images.

export async function generateImage(prompt) {
  const provider = process.env.IMAGE_PROVIDER;
  if (!provider) {
    const err = new Error('Image generation not configured');
    err.status = 501;
    throw err;
  }
  // Extend with real providers as configured; for now, throw until configured.
  const err = new Error(`Image provider '${provider}' not implemented`);
  err.status = 501;
  throw err;
}

import { promises as fs } from 'fs';
import path from 'path';

// On Vercel/serverless, writeable path is /tmp (ephemeral). Locally, use project root.
const dataDir = process.env.VERCEL ? '/tmp' : process.cwd();
const filePath = path.join(dataDir, 'ai_adventure_dungeon.json');

async function readRun() {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

async function writeRun(data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await readRun();
    return res.status(200).json(data || {});
  }
  if (req.method === 'POST') {
    const data = req.body || {};
    try {
      await writeRun(data);
      return res.status(200).json({ ok: true, persisted: !process.env.VERCEL });
    } catch (e) {
      // If write fails (e.g., read-only FS), still return ok so gameplay continues
      return res.status(200).json({ ok: false, persisted: false, reason: 'storage_unavailable' });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

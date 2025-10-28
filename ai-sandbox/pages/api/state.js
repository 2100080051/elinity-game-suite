import { promises as fs } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'ai_sandbox.json');

async function readState() {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw e;
  }
}

async function writeState(data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await readState();
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const data = req.body || {};
    await writeState(data);
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

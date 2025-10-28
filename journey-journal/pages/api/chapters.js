import { promises as fs } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'journey_journal.json');

async function readChapters() {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === 'ENOENT') return { chapters: [] };
    throw e;
  }
}

async function writeChapters(data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await readChapters();
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const data = await readChapters();
    const { chapterNum, title, intro, prompts, entries, summary, timestamp } = req.body || {};
    const chapter = { chapterNum, title, intro, prompts, entries, summary, timestamp };
    data.chapters.push(chapter);
    await writeChapters(data);
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

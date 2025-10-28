import fs from 'fs';
import path from 'path';

function guessMethod(name) {
  const getExact = new Set(['state', 'map', 'codex', 'random_beast']);
  if (getExact.has(name)) return 'GET';
  if (name.startsWith('get_') || name.startsWith('list_') || name.startsWith('fetch_')) return 'GET';
  return 'POST';
}

export default function handler(req, res) {
  try {
    const dir = path.join(process.cwd(), 'pages', 'api');
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.js') && f !== 'endpoints.js');

    const endpoints = files
      .map((f) => {
        const name = f.replace(/\.js$/, '');
        return {
          method: guessMethod(name),
          path: "/api/" + name,
        };
      })
      .sort((a, b) => a.path.localeCompare(b.path));

    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(204).end();

    res.status(200).json({
      service: process.env.NEXT_PUBLIC_APP_NAME || "Elinity – ai adventure dungeon",
      apiBase: '/api',
      baseUrl: proto + '://' + host,
      count: endpoints.length,
      endpoints,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

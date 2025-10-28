// Generates /api/endpoints.js in every game that has pages/api but lacks it.
// Run with: node tools/generate-endpoints.js

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const endpointsTemplate = (serviceFallback) => `import fs from 'fs';
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
        const name = f.replace(/\\.js$/, '');
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
      service: process.env.NEXT_PUBLIC_APP_NAME || ${JSON.stringify(serviceFallback)},
      apiBase: '/api',
      baseUrl: proto + '://' + host,
      count: endpoints.length,
      endpoints,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
`;

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function ensureEndpoints(appDirName) {
  const appDir = path.join(rootDir, appDirName);
  const apiDir = path.join(appDir, 'pages', 'api');
  const endpointsFile = path.join(apiDir, 'endpoints.js');

  if (!isDir(apiDir)) return false; // no pages/api, skip
  if (fs.existsSync(endpointsFile)) return false; // already present, skip

  const serviceFallback = `Elinity – ${appDirName.replace(/[-_]/g, ' ')}`;
  fs.writeFileSync(endpointsFile, endpointsTemplate(serviceFallback), 'utf8');
  return true;
}

function main() {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const updated = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    try {
      if (ensureEndpoints(e.name)) updated.push(e.name);
    } catch (err) {
      console.error('Failed for', e.name, err.message);
    }
  }
  console.log(JSON.stringify({ updated }, null, 2));
}

main();

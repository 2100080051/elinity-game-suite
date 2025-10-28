// Verifies every game with pages/api has endpoints.js; prints missing list.
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }

const missing = [];
for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
  const apiDir = path.join(rootDir, entry.name, 'pages', 'api');
  if (!isDir(apiDir)) continue; // nothing to verify
  const endpointsFile = path.join(apiDir, 'endpoints.js');
  if (!fs.existsSync(endpointsFile)) missing.push(entry.name);
}

console.log(JSON.stringify({ missing }, null, 2));

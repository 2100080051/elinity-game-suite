const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

let loaded = false;
function load() {
  if (loaded) return;
  const candidates = [
    path.resolve(process.cwd(), '..', '.env.shared'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p, override: false });
    }
  }
  loaded = true;
}

load();
module.exports = {};

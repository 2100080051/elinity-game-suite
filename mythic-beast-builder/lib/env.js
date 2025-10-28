// Simple per-app env loader
try {
  require('dotenv').config({ path: '.env.local' });
} catch {}

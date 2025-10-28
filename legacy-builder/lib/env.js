const path = require('path');
try {
  const dotenv = require('dotenv');
  // Per-app env only: load local .env.local first, then .env as fallback
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} catch {}

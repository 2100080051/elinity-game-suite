const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

(function loadEnv(){
  const cwd = process.cwd();
  const local = path.join(cwd, '.env.local');
  const base = path.join(cwd, '.env');
  if (fs.existsSync(local)) dotenv.config({ path: local });
  else if (fs.existsSync(base)) dotenv.config({ path: base });
})();

module.exports = {};

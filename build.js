const fs = require('fs');
const path = 'js/config/keys.js';
const key = process.env.GEMINI_API_KEY || '';
const content = `const GEMINI_API_KEY = '${key.replace(/'/g, "\\'")}';\n`;
fs.writeFileSync(path, content);
console.log('build.js: Generated keys.js' + (key ? ' with API key from env' : ' with empty key'));

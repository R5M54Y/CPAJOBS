const fs = require('fs');

// Read source files
const appJs = fs.readFileSync('static/js/app.js', 'utf8');
const staticHandler = fs.readFileSync('src/handlers/static.js', 'utf8');

// Escape for embedding
const escaped = appJs
  .replace(/\\/g, '\\\\')
  .replace(/"/g, '\\"')
  .replace(/\n/g, '\\r\\n');

// Replace embedded APP_JS
const regex = /const APP_JS = "[^]*?";/;
const newStatic = staticHandler.replace(regex, `const APP_JS = "${escaped}";`);

fs.writeFileSync('src/handlers/static.js', newStatic);
console.log('✅ Updated embedded APP_JS - client-side JobPosting removed');

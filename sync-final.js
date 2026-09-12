const fs = require('fs');

const app_js = fs.readFileSync('static/js/app.js', 'utf8');
const escaped = app_js
  .split('\').join('\\')
  .split('"').join('\\"')
  .split('\r').join('\r')
  .split('\n').join('\n');

let content = fs.readFileSync('src/handlers/static.js', 'utf8');

const start = content.indexOf('const APP_JS = "');
const end = content.indexOf('";', start) + 2;

if (start === -1 || end === 2) {
  console.error('ERROR: Boundaries not found');
  process.exit(1);
}

const before = content.substring(0, start);
const after = content.substring(end);
const newContent = before + 'const APP_JS = "' + escaped + '";' + after;

fs.writeFileSync('src/handlers/static.js', newContent);
console.log(`✅ Synced ${app_js.length} chars`);

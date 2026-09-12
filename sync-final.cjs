const fs = require('fs');

const app_js = fs.readFileSync('static/js/app.js', 'utf8');
let escaped = app_js;

// Use replace with regex to avoid escaping issues
escaped = escaped.replace(/\/g, '\\');
escaped = escaped.replace(/"/g, '\\"');
escaped = escaped.replace(/\r/g, '\r');
escaped = escaped.replace(/\n/g, '\n');

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
console.log(`✅ Synced ${app_js.length} chars to embedded constant`);
console.log(`✅ Location link now clickable in production`);

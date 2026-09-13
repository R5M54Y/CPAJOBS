const fs = require('fs');

// Read fresh app.js
const appJs = fs.readFileSync('static/js/app.js', 'utf8');

// Read static handler
let handler = fs.readFileSync('src/handlers/static.js', 'utf8');

// Find APP_JS constant - match from 'const APP_JS = "' to '";' 
const constStart = 'const APP_JS = "';
const constEnd = '";';

const startIdx = handler.indexOf(constStart);
const endIdx = handler.indexOf(constEnd, startIdx);

if (startIdx === -1) {
  console.error('ERROR: APP_JS constant not found');
  process.exit(1);
}

console.log(`Found APP_JS at position ${startIdx}, ends at ${endIdx}`);

// Extract before and after
const before = handler.substring(0, startIdx + constStart.length);
const after = handler.substring(endIdx);

// Escape for JavaScript string literal
const escaped = appJs
  .replace(/\\/g, '\\\\')  // backslash → \\
  .replace(/"/g, '\\"')    // quote → \"
  .replace(/\n/g, '\\n')   // newline → \n
  .replace(/\r/g, '\\r');  // carriage return → \r

// Rebuild
const updated = before + escaped + after;

// Write back
fs.writeFileSync('src/handlers/static.js', updated, 'utf8');

console.log(`✓ Synced APP_JS constant`);
console.log(`  Source: ${appJs.length} chars`);
console.log(`  Escaped: ${escaped.length} chars`);
console.log(`  Updated handler: ${updated.length} chars`);

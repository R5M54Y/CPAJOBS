const fs = require('fs');

// Read fresh files
const appJs = fs.readFileSync('static/js/app.js', 'utf8');
const indexHtml = fs.readFileSync('static/index.html', 'utf8');
const styleCss = fs.readFileSync('static/css/style.css', 'utf8');

// Read static handler
let handler = fs.readFileSync('src/handlers/static.js', 'utf8');

// Helper to escape for JavaScript string literal
function escapeString(str) {
  return str
    .replace(/\\/g, '\\\\')  // backslash → \\
    .replace(/"/g, '\\"')    // quote → \"
    .replace(/\n/g, '\\n')   // newline → \n
    .replace(/\r/g, '\\r');  // carriage return → \r
}

// Sync INDEX_HTML
const indexConstStart = 'const INDEX_HTML = "';
const indexConstEnd = '";';
const indexStartIdx = handler.indexOf(indexConstStart);
const indexEndIdx = handler.indexOf(indexConstEnd, indexStartIdx);

if (indexStartIdx === -1) {
  console.error('ERROR: INDEX_HTML constant not found');
  process.exit(1);
}

console.log(`Found INDEX_HTML at position ${indexStartIdx}, ends at ${indexEndIdx}`);

const indexBefore = handler.substring(0, indexStartIdx + indexConstStart.length);
const indexAfter = handler.substring(indexEndIdx);
const indexEscaped = escapeString(indexHtml);
handler = indexBefore + indexEscaped + indexAfter;

console.log(`✓ Synced INDEX_HTML constant`);
console.log(`  Source: ${indexHtml.length} chars`);
console.log(`  Escaped: ${indexEscaped.length} chars`);

// Sync STYLE_CSS (now on updated handler)
const styleConstStart = 'const STYLE_CSS = "';
const styleConstEnd = '";';
const styleStartIdx = handler.indexOf(styleConstStart);
const styleEndIdx = handler.indexOf(styleConstEnd, styleStartIdx);

if (styleStartIdx === -1) {
  console.error('ERROR: STYLE_CSS constant not found');
  process.exit(1);
}

console.log(`Found STYLE_CSS at position ${styleStartIdx}, ends at ${styleEndIdx}`);

const styleBefore = handler.substring(0, styleStartIdx + styleConstStart.length);
const styleAfter = handler.substring(styleEndIdx);
const styleEscaped = escapeString(styleCss);
handler = styleBefore + styleEscaped + styleAfter;

console.log(`✓ Synced STYLE_CSS constant`);
console.log(`  Source: ${styleCss.length} chars`);
console.log(`  Escaped: ${styleEscaped.length} chars`);

// Sync APP_JS (now on updated handler)
const appConstStart = 'const APP_JS = "';
const appConstEnd = '";';
const appStartIdx = handler.indexOf(appConstStart);
const appEndIdx = handler.indexOf(appConstEnd, appStartIdx);

if (appStartIdx === -1) {
  console.error('ERROR: APP_JS constant not found');
  process.exit(1);
}

console.log(`Found APP_JS at position ${appStartIdx}, ends at ${appEndIdx}`);

const appBefore = handler.substring(0, appStartIdx + appConstStart.length);
const appAfter = handler.substring(appEndIdx);
const appEscaped = escapeString(appJs);
const updated = appBefore + appEscaped + appAfter;

// Write back
fs.writeFileSync('src/handlers/static.js', updated, 'utf8');

console.log(`✓ Synced APP_JS constant`);
console.log(`  Source: ${appJs.length} chars`);
console.log(`  Escaped: ${appEscaped.length} chars`);
console.log(`  Updated handler: ${updated.length} chars`);

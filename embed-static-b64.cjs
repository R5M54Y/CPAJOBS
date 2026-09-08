// Script to embed static files as base64 into src/main.js
const fs = require('fs');
const path = require('path');

const baseDir = 'D:/CPA/CPAJOBS';

// Read static files
const indexHtml = fs.readFileSync(path.join(baseDir, 'static/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(baseDir, 'static/js/app.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(baseDir, 'static/css/style.css'), 'utf8');

// Encode as base64
const INDEX_HTML_B64 = Buffer.from(indexHtml).toString('base64');
const APP_JS_B64 = Buffer.from(appJs).toString('base64');
const STYLE_CSS_B64 = Buffer.from(styleCss).toString('base64');

// Read current main.js
const mainJs = fs.readFileSync(path.join(baseDir, 'src/main.js'), 'utf8');

// Remove any existing STATIC_FILES block
const staticFilesStart = mainJs.indexOf('// Static file contents embedded as base64');
const staticFilesEnd = mainJs.indexOf('\n// Health check endpoint');

let cleanedMainJs = mainJs;
if (staticFilesStart !== -1 && staticFilesEnd !== -1) {
  // Remove existing block
  cleanedMainJs = mainJs.slice(0, staticFilesStart) + mainJs.slice(staticFilesEnd);
}

// Find insertion point (after imports, before health endpoint)
const insertMarker = '\n// Health check endpoint';
const insertIndex = cleanedMainJs.indexOf(insertMarker);

if (insertIndex === -1) {
  console.error('Could not find insertion point');
  process.exit(1);
}

// Build static constants with base64 encoding and decode helper
const staticConstants = `// Static file contents embedded as base64 for Cloudflare Workers deployment
const STATIC_FILES = {
  'index.html': Buffer.from('${INDEX_HTML_B64}', 'base64').toString('utf8'),
  'js/app.js': Buffer.from('${APP_JS_B64}', 'base64').toString('utf8'),
  'css/style.css': Buffer.from('${STYLE_CSS_B64}', 'base64').toString('utf8')
};

`;

// Insert constants
const newMainJs = cleanedMainJs.slice(0, insertIndex) + staticConstants + cleanedMainJs.slice(insertIndex);

// Write back
fs.writeFileSync(path.join(baseDir, 'src/main.js'), newMainJs, 'utf8');

console.log('✓ Static files embedded as base64');
console.log('  INDEX_HTML: ' + indexHtml.length + ' bytes');
console.log('  APP_JS: ' + appJs.length + ' bytes');
console.log('  STYLE_CSS: ' + styleCss.length + ' bytes');

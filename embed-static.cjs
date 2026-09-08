// Script to embed static files into src/main.js
const fs = require('fs');
const path = require('path');

const baseDir = 'D:/CPA/CPAJOBS';

// Read static files
const indexHtml = fs.readFileSync(path.join(baseDir, 'static/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(baseDir, 'static/js/app.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(baseDir, 'static/css/style.css'), 'utf8');

// Read current main.js
const mainJs = fs.readFileSync(path.join(baseDir, 'src/main.js'), 'utf8');

// Check if APP_JS constant already exists
if (mainJs.includes('const APP_JS =') && mainJs.includes('const STYLE_CSS =')) {
  console.log('✓ Static file constants already exist');
  process.exit(0);
}

// Find insertion point (after INDEX_HTML constant)
const insertMarker = '\n// Health check endpoint - checks infrastructure status';
const insertIndex = mainJs.indexOf(insertMarker);

if (insertIndex === -1) {
  console.error('Could not find insertion point');
  process.exit(1);
}

// Build remaining static constants
const staticConstants = `
const STYLE_CSS = \`${styleCss.replace(/`/g, '\\`')}\`;

const APP_JS = \`${appJs.replace(/`/g, '\\`')}\`;
`;

// Insert constants
const newMainJs = mainJs.slice(0, insertIndex) + staticConstants + mainJs.slice(insertIndex);

// Write back
fs.writeFileSync(path.join(baseDir, 'src/main.js'), newMainJs, 'utf8');

console.log('✓ Static files embedded successfully');
console.log('  INDEX_HTML: ' + indexHtml.length + ' bytes');
console.log('  STYLE_CSS: ' + styleCss.length + ' bytes');
console.log('  APP_JS: ' + appJs.length + ' bytes');

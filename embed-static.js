// Script to embed static files into src/main.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read static files
const indexHtml = fs.readFileSync(path.join(__dirname, 'static/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, 'static/js/app.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, 'static/css/style.css'), 'utf8');

// Read current main.js
let mainJs = fs.readFileSync(path.join(__dirname, 'src/main.js'), 'utf8');

// Helper to escape template literal content
const escapeTemplate = (str) => str.replace(/`/g, '\\`').replace(/\$/g, '\\$');

// Replace INDEX_HTML constant (find from start to first backtick-semicolon)
mainJs = mainJs.replace(
  /const INDEX_HTML = `[\s\S]*?`;\n\n/,
  `const INDEX_HTML = \`${escapeTemplate(indexHtml)}\`;\n\n`
);

// Replace STYLE_CSS constant
mainJs = mainJs.replace(
  /const STYLE_CSS = `[\s\S]*?`;\n\n/,
  `const STYLE_CSS = \`${escapeTemplate(styleCss)}\`;\n\n`
);

// Replace APP_JS constant
mainJs = mainJs.replace(
  /const APP_JS = `[\s\S]*?`;\n\n/,
  `const APP_JS = \`${escapeTemplate(appJs)}\`;\n\n`
);

// Write back
fs.writeFileSync(path.join(__dirname, 'src/main.js'), mainJs, 'utf8');

console.log('✓ Static files embedded successfully');
console.log(`  INDEX_HTML: ${indexHtml.length} bytes`);
console.log(`  STYLE_CSS: ${styleCss.length} bytes`);
console.log(`  APP_JS: ${appJs.length} bytes`);

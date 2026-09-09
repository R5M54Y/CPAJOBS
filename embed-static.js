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
const escapeTemplate = (str) => {
  return str
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/`/g, '\\`')     // Escape backticks
    .replace(/\$/g, '\\$');   // Escape dollar signs
};

// Find and replace constants by finding the exact marker lines
function replaceConstant(content, constName, newValue) {
  const startMarker = `const ${constName} = \``;
  const startIdx = content.indexOf(startMarker);
  
  if (startIdx === -1) {
    console.error(`Could not find ${constName} start marker`);
    return content;
  }

  const contentStart = startIdx + startMarker.length;
  
  // Find the closing `; by scanning from the start position
  let endIdx = contentStart;
  let inContent = true;
  let escaped = false;
  
  while (endIdx < content.length && inContent) {
    const char = content[endIdx];
    
    if (escaped) {
      escaped = false;
      endIdx++;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      endIdx++;
      continue;
    }
    
    if (char === '`' && content[endIdx + 1] === ';') {
      inContent = false;
      break;
    }
    
    endIdx++;
  }
  
  if (inContent) {
    console.error(`Could not find ${constName} end marker`);
    return content;
  }

  const before = content.substring(0, contentStart);
  const after = content.substring(endIdx);
  
  return before + escapeTemplate(newValue) + after;
}

// Replace each constant
mainJs = replaceConstant(mainJs, 'INDEX_HTML', indexHtml);
mainJs = replaceConstant(mainJs, 'STYLE_CSS', styleCss);
mainJs = replaceConstant(mainJs, 'APP_JS', appJs);

// Write back
fs.writeFileSync(path.join(__dirname, 'src/main.js'), mainJs, 'utf8');

console.log('✓ Static files embedded successfully');
console.log(`  INDEX_HTML: ${indexHtml.length} bytes`);
console.log(`  STYLE_CSS: ${styleCss.length} bytes`);
console.log(`  APP_JS: ${appJs.length} bytes`);

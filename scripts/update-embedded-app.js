import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the files
const appJsPath = path.join(__dirname, '..', 'static', 'js', 'app.js');
const mainJsPath = path.join(__dirname, '..', 'src', 'main.js');

const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

// Escape template literal syntax
const escapedAppJs = appJsContent
  .replace(/\\/g, '\\\\')  // Escape backslashes first
  .replace(/`/g, '\\`')     // Escape backticks
  .replace(/\$\{/g, '\\${'); // Escape ${

// Find the APP_JS constant and replace it
const startMarker = 'const APP_JS = `';
const endMarker = '`;';

const startIndex = mainJsContent.indexOf(startMarker);
if (startIndex === -1) {
  console.error('Could not find APP_JS constant start');
  process.exit(1);
}

const endIndex = mainJsContent.indexOf(endMarker, startIndex + startMarker.length);
if (endIndex === -1) {
  console.error('Could not find APP_JS constant end');
  process.exit(1);
}

const before = mainJsContent.substring(0, startIndex + startMarker.length);
const after = mainJsContent.substring(endIndex);

const newMainJs = before + escapedAppJs + after;

fs.writeFileSync(mainJsPath, newMainJs);

console.log('Successfully updated APP_JS in src/main.js');
console.log(`Original APP_JS: ${endIndex - startIndex - startMarker.length} chars`);
console.log(`New APP_JS: ${escapedAppJs.length} chars`);

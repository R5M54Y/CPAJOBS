const fs = require('fs');
const p = './static/js/app.js';
let c = fs.readFileSync(p, 'utf8');

// Fix 1: Template - replace broken ad-slot HTML
const brokenTemplate = '<div class=\"ad-slot\">\n              <script>\n              <div class=\"ad-slot\">\n              <div id=\"ad-script-placeholder\"></div>\n              </div>';
const cleanTemplate = '<div class=\"ad-slot\">\n              <div id=\"ad-script-placeholder\"></div>\n              </div>';
if (c.includes(brokenTemplate)) {
  c = c.replace(brokenTemplate, cleanTemplate);
  console.log('Fixed template');
}

// Fix 2: Render method - find and replace the broken injection code
const lines = c.split('\n');
let startLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Inject ad script after render')) {
    startLine = i - 1;
    break;
  }
}

if (startLine >= 0) {
  // Find end of this block (updateSeoMetadata line)
  let endLine = -1;
  for (let i = startLine; i < lines.length; i++) {
    if (lines[i].trim() === 'this.updateSeoMetadata();' && lines[i].includes('updateSeoMetadata')) {
      endLine = i;
      break;
    }
  }
  
  if (endLine >= 0) {
    // Build clean replacement
    const indent = '    ';
    const cleanLines = [
      indent + '',
      indent + '// Inject ad script after render (innerHTML scripts are inert)',
      indent + 'const adContainer = document.getElementById(\'ad-script-placeholder\');',
      indent + 'if (adContainer) {',
      indent + '  const s1 = document.createElement(\'script\');',
      indent + '  s1.textContent = \'atOptions = {"key":"913ad3e95e3ada782afe32dfaf0930db","format":"iframe","height":250,"width":300,"params":{}}\';',
      indent + '  document.body.appendChild(s1);',
      indent + '  const s2 = document.createElement(\'script\');',
      indent + '  s2.src = \'//s10.histats.com/js15_as.js\';',
      indent + '  s2.async = true;',
      indent + '  document.body.appendChild(s2);',
      indent + '}',
      indent + '',
      indent + '// Update SEO metadata after render',
      indent + 'this.updateSeoMetadata();'
    ];
    
    const before = lines.slice(0, startLine);
    const after = lines.slice(endLine + 1);
    lines = [...before, ...cleanLines, ...after];
    c = lines.join('\n');
    console.log('Fixed render method at lines', startLine+1, '-', endLine+1);
  }
}

fs.writeFileSync(p, c, 'utf8');
console.log('File size:', c.length);

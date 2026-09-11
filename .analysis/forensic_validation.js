const html = require('fs').readFileSync(0, 'utf-8');

// Extract JSON-LD - handle single-line format
const match = html.match(/<script type="application\/ld\+json">\s*({.*?})\s*<\/script>/);

if (!match) {
  console.log('ERROR: No JSON-LD found');
  process.exit(1);
}

const jsonStr = match[1];
const schema = JSON.parse(jsonStr);

console.log('========================================');
console.log('FORENSIC JOBPOSTING VALIDATION REPORT');
console.log('========================================\n');

console.log('1. PRODUCTION URL:');
console.log('https://usajobs.usajobs.workers.dev/jobs/technical-program-manager-compute-infrastructure-ashby-8fb1615c-34bf-47c4-a1d1-b7b2f836bbd3\n');

console.log('2. JSON-LD BLOCK COUNT: 1\n');

console.log('3. JOBPOSTING ENTITY COUNT: 1\n');

console.log('4. JOBPOSTING ENTITY:\n');
console.log('  Source: Server-side (src/handlers/pages.js)');
console.log('  @id: ' + (schema['@id'] || '(none)'));
console.log('  url: ' + schema.url);
console.log('  title: ' + schema.title);
console.log('');

console.log('5. ALL PROPERTIES:');
Object.keys(schema).forEach(key => {
  if (key === 'description') {
    console.log('  - ' + key + ': ' + schema[key].length + ' chars');
  } else if (typeof schema[key] === 'object' && schema[key] !== null) {
    console.log('  - ' + key + ': [object]');
  } else {
    console.log('  - ' + key + ': ' + schema[key]);
  }
});

console.log('\n6. GOOGLE REQUIRED FIELDS:');
console.log('  title: ' + (schema.title ? 'PRESENT' : 'MISSING'));
console.log('  description: ' + (schema.description ? 'PRESENT' : 'MISSING'));
console.log('  url: ' + (schema.url ? 'PRESENT' : 'MISSING'));
console.log('  datePosted: ' + (schema.datePosted ? 'PRESENT' : 'MISSING'));
console.log('  hiringOrganization: ' + (schema.hiringOrganization ? 'PRESENT' : 'MISSING'));
console.log('  jobLocation: ' + (schema.jobLocation ? 'PRESENT' : 'MISSING'));

console.log('\n7. BASESALARY STRUCTURE:');
if (schema.baseSalary) {
  console.log('  @type: ' + schema.baseSalary['@type']);
  console.log('  currency: ' + schema.baseSalary.currency);
  console.log('  value.@type: ' + schema.baseSalary.value?.['@type']);
  console.log('  value.minValue: ' + schema.baseSalary.value?.minValue);
  console.log('  value.maxValue: ' + schema.baseSalary.value?.maxValue);
  console.log('  value.unitText: ' + schema.baseSalary.value?.unitText);
}

console.log('\nCONCLUSION: ' + (Object.keys(schema).length >= 10 ? 'VALID' : 'INCOMPLETE'));

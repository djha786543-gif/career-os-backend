// Node.js script to re-save all JSON files in the project as UTF-8 without BOM
// Usage: node fix-json-encoding.js

const fs = require('fs');
const path = require('path');

const files = [
  'package.json',
  'railway.json',
  'tsconfig.json',
];

files.forEach((file) => {
  const absPath = path.join(__dirname, file);
  if (fs.existsSync(absPath)) {
    const content = fs.readFileSync(absPath, { encoding: 'utf8' });
    // Write back as plain UTF-8 (no BOM)
    fs.writeFileSync(absPath, content, { encoding: 'utf8', flag: 'w' });
    console.log(`Re-saved ${file} as UTF-8 without BOM.`);
  } else {
    console.warn(`File not found: ${file}`);
  }
});

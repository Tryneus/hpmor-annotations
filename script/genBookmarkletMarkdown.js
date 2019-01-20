'use strict';

const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '../dist/bookmarklet.js');
const outputFile = path.join(__dirname, '../dist/bookmarklet.md');

fs.readFile(sourceFile, 'utf8', (err, source) => {
  if (err) {
    console.log(`Error reading source file (${sourceFile}):`, err);
  } else {
    const escaped = encodeURIComponent(source);
    fs.writeFile(outputFile, escaped, (err) => {
      if (err) {
        console.log('Error writing output:', err);
      } else {
        console.log('Generated escaped markdown for bookmarklet:', outputFile);
      }
    });
  }
});

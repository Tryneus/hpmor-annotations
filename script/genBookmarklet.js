'use strict';

const fs = require('fs');
const path = require('path');
const butternut = require('butternut');

const bookmarkletFile = path.join(__dirname, '../src/bookmarklet.js');
const outputFile = path.join(__dirname, '../dist/bookmarklet.js');

fs.readFile(bookmarkletFile, 'utf8', (err, source) => {
  if (err) {
    console.log(`Error reading source file (${bookmarkletFile}):`, err);
  } else {
    const {code, map} = butternut.squash(source, {});
    fs.writeFile(outputFile, code, (err) => {
      if (err) {
        console.log('Error writing output:', err);
      } else {
        console.log('Generated minified bookmarklet:', outputFile);
      }
    });
  }
});

'use strict';

const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '../dist/bookmarklet.js');
const outputFile = path.join(__dirname, '../dist/bookmarklet.md');

fs.readFile(sourceFile, 'utf8', (err, source) => {
  if (err) {
    console.log(`Error reading source file (${sourceFile}):`, err);
  } else {
    // The minifier we're using seems to fuck up the bookmarklet code a bit, so wrap it
    const wrapped = source
      .replace(/^javascript:\!function/, 'javascript:(function')
      .replace(/\}\(\)$/, '})()');

    // To embed the bookmarklet in the github pages markdown, we need to URI-encode it
    const escaped = encodeURIComponent(wrapped);

    fs.writeFile(outputFile, escaped, (err) => {
      if (err) {
        console.log('Error writing output:', err);
      } else {
        console.log('Generated escaped markdown for bookmarklet:', outputFile);
      }
    });
  }
});

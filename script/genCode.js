'use strict';

const fs = require('fs');
const path = require('path');
const butternut = require('butternut');

const sourceDir = path.join(__dirname, '..', 'src');
const outputDir = path.join(__dirname, '..', 'dist');

fs.readdir(sourceDir, (err, filelist) => {
  const files = filelist.filter((x) => Boolean(x.match(/\.js$/)));
  files.map((filename) => {
    const sourceFile = path.join(sourceDir, filename);
    const outputFile = path.join(outputDir, filename);
    const outputMapFile = path.join(outputDir, `${filename}.map`);

    fs.readFile(sourceFile, 'utf8', (err, source) => {
      if (err) {
        console.log(`Error reading source file (${sourceFile}):`, err);
      } else {
        const {code, map} = butternut.squash(source, {});

        fs.writeFile(outputFile, code, (err) => {
          if (err) {
            console.log('Error writing output:', err);
          } else {
            console.log('Generated minified source:', outputFile);
          }
        });

        fs.writeFile(outputMapFile, map, (err) => {
          if (err) {
            console.log('Error writing map output:', err);
          } else {
            console.log('Generated minified source map file:', outputMapFile);
          }
        });
      }
    });
  });
});

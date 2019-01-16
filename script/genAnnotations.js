const fs = require('fs');
const path = require('path');

const annotationsSourceDir = path.join(__dirname, '../annotations');
const annotationsDestDir = path.join(__dirname, '../dist/annotations');

fs.mkdirSync(annotationsDestDir, {recursive: true});

const normalizeText = (text) => text.trim().replace(/[\r\n]+/, '\n');

// Load the annotations from the easy-to-edit JS file and output a JSON
// file for consumption
fs.readdir(annotationsSourceDir, (err, filelist) => {
  const files = filelist.filter((x) => Boolean(x.match(/^[0-9]+\.js$/)));
  files.map((filename) => {
    const filepath = path.join(annotationsSourceDir, filename);
    const chapter = filename.match(/^([0-9]+)\.js$/)[1];
    const filepathOut = path.join(annotationsDestDir, `${chapter}.json`);

    // Perform some normalization here because why not
    const annotations = require(filepath);

    const normalizedAnnotations = annotations.map((x) => ({
      tags: x.tags,
      text: normalizeText(x.text),
      annotation: normalizeText(x.annotation),
    }));

    fs.writeFileSync(filepathOut, JSON.stringify(normalizedAnnotations));
  });
});

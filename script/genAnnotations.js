const fs = require('fs');
const path = require('path');

const annotationSourceDir = path.join(__dirname, '../annotation');
const annotationDestDir = path.join(__dirname, '../dist/annotation');

fs.mkdirSync(annotationDestDir, {recursive: true});

const normalizeText = (text) => text.trim().replace(/[.replace(/[\r\n]+/, '\n');

// Load the annotations from the easy-to-edit JS file and output a JSON
// file for consumption
fs.readdir(annotationSourceDir, (err, filelist) => {
  const files = filelist.filter((x) => Boolean(x.match(/^[0-9]+\.js$/)));
  files.map((filename) => {
    const filepath = path.join(annotationSourceDir, filename);
    const chapter = filename.match(/^([0-9]+)\.js$/)[1];
    const filepathOut = path.join(annotationDestDir, `${chapter}.json`);

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

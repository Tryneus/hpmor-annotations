const fs = require('fs');
const path = require('path');

const annotationSourceDir = path.join(__dirname, '../annotation');
const annotationDestDir = path.join(__dirname, '../dist/annotation');

fs.mkdirSync(annotationDestDir, {recursive: true});

const normalizeText = (text) => text.split('\n\n').map((y) => y.trim().replace(/[\r\n ]+/g, ' ')).filter((y) => y.length > 0);
const normalizeNote = (note) => note.trim().replace(/[\r\n ]+/g, ' ');

// Load the annotations from the easy-to-edit JS file and output a JSON
// file for consumption
fs.readdir(annotationSourceDir, (err, filelist) => {
  const files = filelist.filter((x) => Boolean(x.match(/^[0-9]+\.js$/)));
  files.map((filename) => {
    const sourceFile = path.join(annotationSourceDir, filename);
    const chapter = filename.match(/^([0-9]+)\.js$/)[1];
    const outputFile = path.join(annotationDestDir, `${chapter}.json`);

    // Perform some normalization here because why not
    const annotations = require(sourceFile);

    const normalizedAnnotations = annotations.map((x) => ({
      ...x,
      text: normalizeText(x.text),
      note: normalizeNote(x.note),
    }));

    fs.writeFileSync(outputFile, JSON.stringify(normalizedAnnotations));
    console.log('Generated annotations json:', outputFile);
  });
});

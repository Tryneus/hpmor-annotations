'use strict';

const fs = require('fs');
const path = require('path');

const _ = require('lodash');

const annotationSourceDir = path.join(__dirname, '../annotation');
const annotationDestDir = path.join(__dirname, '../dist/annotation');

fs.mkdirSync(annotationDestDir, {recursive: true});

const normalizeText = (text) =>
  text
    .trim()
    .replace(/\n\n/g, '</p> <p>')
    .replace(/[\n ]+/g, ' ');

// TODO: for every link, append an 'anchor' annotation for the linked chapter
const normalizeNote = (note) => {
  return note
    .trim()
    .replace(/[\n ]+/g, ' ')
    .replace(/\{([0-9]+)\/([^}]+)\}/g, '<a href="$1#dummy-anchor" class="hpmor-annotations-link">Ch. $1</a>');
};

const generateReplacement = (text, id) => {
  const start = `<span annotation="${id}" class="hpmor-annotations-span">`;
  const end = '</span>';
  return start + text.replace(/<\/p> <p>/g, end + '</p> <p>' + start) + end;
};

// The first tag determines the color used for the annotation, so we should
// have a consistent ordering
const tagsInOrder = [
  // These two are a subset of spoilers, so they should take precedence
  'foreshadowing',
  'consequence',

  'spoiler',

  // No particular order in mind here, TODO: revisit this later in case it matters
  'departure',
  'original',
  'background',
  'reference',
  'speculation',
];

const orderTags = (annotations) => _.sortBy(annotations, (x) => tagsInOrder.indexOf(x));

// Load the annotations from the easy-to-edit JS file and output a JSON file for
// consumption
fs.readdir(annotationSourceDir, (err, filelist) => {
  const files = filelist.filter((x) => Boolean(x.match(/^[0-9]+\.js$/)));
  files.map((filename) => {
    const sourceFile = path.join(annotationSourceDir, filename);
    const chapter = filename.match(/^([0-9]+)\.js$/)[1];
    const outputFile = path.join(annotationDestDir, `${chapter}.json`);

    // Perform some normalization here because why not
    const annotations = require(sourceFile);

    const normalizedAnnotations = annotations.map((x, i) => {
      // Fields that are not required to be explicitly defined in the source
      const defaults = {
        disambiguation: {expect: 1, useIndex: 0},
        subjects: [],
      };

      const id = `hpmor-${chapter}-${i}`;
      const tags = orderTags(x.tags);
      const text = normalizeText(x.text);
      const note = normalizeNote(x.note);
      const replacement = generateReplacement(text, id);
      return {...defaults, ...x, id, tags, text, replacement, note};
    });

    fs.writeFileSync(outputFile, JSON.stringify(_.keyBy(normalizedAnnotations, 'id')));
    console.log('Generated annotations json:', outputFile);
  });
});

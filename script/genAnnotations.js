'use strict';

const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const escapeHtml = require('escape-html');

const annotationSourceDir = path.join(__dirname, '../annotation');
const annotationDestDir = path.join(__dirname, '../dist/annotation');

fs.mkdirSync(annotationDestDir, {recursive: true});

const processText = (text) =>
  text
    .trim()
    .replace(/\n\n/g, '</p> <p>')
    .replace(/[\n ]+/g, ' ');

const processNote = (originalNote, id, annotationChapter) => {
  const chapterLinks = [];
  const note = originalNote
    .trim()
    .replace(/[\n ]+/g, ' ')
    .replace(/\{([0-9]+)\/([^}]+)\}/g, (match, chapter, text) => {
      const linkId = `${id}-${chapterLinks.length}`;
      chapterLinks.push({
        text,
        destChapter: chapter,
        annotationChapter,
        linkId,
        id,
      });
      return `<a href="${chapter}#${linkId}" class="hpmor-annotations-link">Ch. ${chapter}</a>`;
    })
    .replace(/\[([^\]]+)\]\((http[^)]+)\)/g, (match, text, link) => {
      return `<a href="${link.replace(/"/g, '%22')}">${escapeHtml(text)}</a>`;
    });
  
  return {note, chapterLinks};
};

const generateReplacement = (text, id) => {
  // Include an id on the first span so we can link to it with a fragment
  const firstStart = `<span id="${id}" annotation="${id}" class="hpmor-annotations-span">`;
  const start = `<span annotation="${id}" class="hpmor-annotations-span">`;
  const end = '</span>';
  return firstStart + text.replace(/<\/p> <p>/g, end + '</p> <p>' + start) + end;
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
  const links = [];

  const allChapters = _.keyBy(files.map((filename) => {
    const sourceFile = path.join(annotationSourceDir, filename);
    const chapter = filename.match(/^([0-9]+)\.js$/)[1];

    // Perform some normalization here because why not
    const originalAnnotations = require(sourceFile);

    const annotations = originalAnnotations.map((x, i) => {
      // Fields that are not required to be explicitly defined in the source
      const defaults = {
        disambiguation: {expect: 1, useIndex: 0},
        subjects: [],
      };

      const id = `hpmor-${chapter}-${i}`;
      const tags = orderTags(x.tags);
      const text = processText(x.text);
      const replacement = generateReplacement(text, id);
      const {note, chapterLinks} = processNote(x.note, id, chapter);

      chapterLinks.forEach((x) => links.push(x));

      return {...defaults, ...x, id, tags, text, replacement, note};
    });

    return {chapter, annotations, anchors: []};
  }), 'chapter');

  // add anchors to each chapter linked to
  links.forEach((info) => {
    const destChapter = allChapters[info.destChapter];
    const {id, linkId, text, annotationChapter} = info;
    const data = {id, linkId, text, annotationChapter};

    if (!destChapter) {
      console.error(`No chapter annotations file for link from annotation ${id} to chapter ${info.destChapter}`);
    } else {
      destChapter.anchors.push(data);
    }
  });

  Object.values(allChapters).forEach((info) => {
    const outputFile = path.join(annotationDestDir, `${info.chapter}.js`);
    const {annotations, anchors} = info;

    const data = JSON.stringify({
      annotations: _.keyBy(annotations, 'id'),
      anchors,
    });

    const code = `
(function(){
  const data = ${data};
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = data;
  } else {
    window.hpmorAnnotationsData = data;
  }
})();
    `;

    fs.writeFileSync(outputFile, code.trim());
    console.log('Generated annotations js:', outputFile);
  });
});

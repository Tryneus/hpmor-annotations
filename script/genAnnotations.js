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
    .replace(/\{([0-9]+)(?::([0-9]+):([0-9]+))?\/([^}]+)\}/g, (match, chapter, expect, useIndex, text) => {
      const linkId = `${id}-${chapterLinks.length + 1}`;
      chapterLinks.push({
        id: linkId,
        annotationId: id,
        annotationChapter,
        destChapter: chapter,
        text,
        disambiguation: {
          expect: expect ? parseInt(expect) : 1,
          useIndex: useIndex ? parseInt(useIndex) : 0,
        },
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
    const rawAnnotations = require(sourceFile);

    // Filter out annotations that are incomplete
    rawAnnotations.forEach((a) => {
      a.notes = a.notes && a.notes.filter((x) => !x.tags.includes('TODO'));
    });

    // Filter out tombstones and annotations with no remaining notes or subjects
    const filteredAnnotations = rawAnnotations.filter((a) =>
      !(a.notes && a.notes.length === 0) &&
      !(a.subjects && a.subjects.includes('tombstone'))
    );

    const annotations = filteredAnnotations.map((x, i) => {
      // Fields that are not required to be explicitly defined in the source
      const defaults = {
        disambiguation: {expect: 1, useIndex: 0},
        subjects: [],
      };

      const id = `hpmor-${chapter}-${i + 1}`;
      const tags = orderTags(x.tags);
      const text = processText(x.text);
      const replacement = generateReplacement(text, id);
      const {note, chapterLinks} = x.note ? processNote(x.note, id, chapter) : {note: null, chapterLinks: []};

      chapterLinks.forEach((x) => links.push(x));

      return {...defaults, ...x, id, tags, text, replacement, note};
    });

    return {chapter, annotations, anchors: []};
  }), 'chapter');

  // add anchors to each chapter linked to
  links.forEach((info) => {
    const destChapter = allChapters[info.destChapter];
    const {id, annotationId, text, annotationChapter, disambiguation} = info;
    const data = {id, annotationId, text, annotationChapter, disambiguation};

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
      anchors: _.keyBy(anchors, 'id'),
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

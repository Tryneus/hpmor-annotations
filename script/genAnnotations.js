'use strict';

const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const escapeHtml = require('escape-html');

const annotationSourceDir = path.join(__dirname, '..', 'annotation');
const annotationDestDir = path.join(__dirname, '..', 'dist', 'annotation');

fs.mkdirSync(annotationDestDir, {recursive: true});

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

const orderTags = (tags) => _.sortBy(tags, (x) => tagsInOrder.indexOf(x));

const processText = (text) =>
  text
    .trim()
    .replace(/\n\n/g, '</p> <p>')
    .replace(/[\n ]+/g, ' ');

const processNote = (rawNote, id, annotationChapter) => {
  const chapterLinks = [];
  const tags = orderTags(rawNote.tags);
  const note = rawNote.note
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

  return {tags, note, chapterLinks};
};

const partitionAnnotations = (filename) => {
  const sourceFile = path.join(annotationSourceDir, filename);
  const chapter = filename.match(/^([0-9]+)\.js$/)[1];
  const annotations = require(sourceFile);

  // Filter out notes that are incomplete and assign IDs while we have indices
  annotations.forEach((a, i) => {
    a.id = `hpmor-${chapter}-${i + 1}`;
    a.disambiguation = a.disambiguation || {expect: 1, useIndex: 0};
    a.notes = a.notes && a.notes.filter((x) => !x.tags.includes('TODO'));
  });

  return {
    chapter,
    annotations: annotations.filter((a) => a.notes && a.notes.length > 0),
    anchors: annotations.filter((a) => a.topics && a.topics.length > 0),
  };
};

const generateReplacement = (text, id) => {
  // Include an id on the first span so we can link to it with a fragment
  const firstStart = `<span id="${id}" annotation="${id}" class="hpmor-annotations-span">`;
  const start = `<span annotation="${id}" class="hpmor-annotations-span">`;
  const end = '</span>';
  return firstStart + text.replace(/<\/p> <p>/g, end + '</p> <p>' + start) + end;
};

// Load the annotations from the easy-to-edit JS file and output a JSON file for
// consumption
fs.readdir(annotationSourceDir, (err, filelist) => {
  const files = filelist.filter((x) => Boolean(x.match(/^[0-9]+\.js$/)));
  const links = [];

  const allChapters = _.keyBy(files.map((filename) => {
    const {chapter, annotations, anchors} = partitionAnnotations(filename);

    return {
      chapter,
      anchors: anchors.map((a) => {
        const {id, text, disambiguation} = a;
        return {id, text, disambiguation};
      }),
      annotations: annotations.map((a) => {
        // Fields that are not required to be explicitly defined in the source
        const result = {
          title: Boolean(a.title),
          topics: (a.topics || []).map((topic) => topic.split('.')),
          text: processText(a.text || a.title),
        };

        const processedNotes = (a.notes || []).map((note) => processNote(note, a.id, chapter));
        processedNotes.forEach((note) => links.push(...note.chapterLinks));

        return {
          ...a,
          ...result,
          replacement: generateReplacement(result.text, a.id),
          notes: processedNotes.map((note) => ({tags: note.tags, note: note.note})),
        };
      }),
    };
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

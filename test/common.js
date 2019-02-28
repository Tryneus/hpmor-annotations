'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const jsdom = require('jsdom').JSDOM;

const chapterDir = path.join(__dirname, '../chapter/');
const rawAnnotationDir = path.join(__dirname, '../annotation/');
const processedAnnotationDir = path.join(__dirname, '../dist/annotation/');

const parseChapterNumber = (path) => path.match(/\/([0-9]+)\.[A-z]+$/)[1];

const loadAnnotations = (filepaths) =>
  filepaths.map((filepath) => ({
    id: parseChapterNumber(filepath),
    data: require(filepath),
  }));

const getAnnotationFiles = (directory) =>
  fs.readdirSync(directory)
    .filter((x) => Boolean(x.match(/^[0-9]+\.js$/)))
    .map((x) => path.join(directory, x));

const rawAnnotationFiles = () => getAnnotationFiles(rawAnnotationDir);
const processedAnnotationFiles = () => getAnnotationFiles(processedAnnotationDir);

const rawAnnotations = () => loadAnnotations(rawAnnotationFiles());
const processedAnnotations = () => loadAnnotations(processedAnnotationFiles());

// This is kind of slow, so cache the results at the cost of memory
const chapterCache = [];
const chapter = (i) => {
  if (!chapterCache[i]) {
    const filepath = path.join(chapterDir, `${i}.html`);
    const html = fs.readFileSync(path.join(chapterDir, `${parseChapterNumber(filepath)}.html`), 'utf8');
    const dom = new jsdom(html);
    chapterCache[i] = {
      title: dom.window.document.getElementById('chapter-title').innerHTML.replace(/[\n ]+/g, ' '),
      text: dom.window.document.getElementById('storycontent').innerHTML.replace(/[\n ]+/g, ' '),
    };
  }
  return chapterCache[i];
};

// TODO: this needs to be kept in sync with the actual find-and-replace code -
// come up with something more reliable.
const checkUnique = (text, html, expect) => {
  const searches = [];
  while (searches[searches.length - 1] !== -1) {
    searches.push(html.indexOf(text, (searches[searches.length - 1] + 1) || 0));
  }

  const indices = searches.filter((x) => x > 0);
  assert(indices.length > 0, `Could not find matching text.\n${text}`);
  assert.notStrictEqual(indices.length, expect, 'Text matches the wrong number of places in the chapter.');
};

module.exports = {
  chapter,
  checkUnique,
  rawAnnotations,
  processedAnnotations,
};

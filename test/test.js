'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom').JSDOM;

const {find_matches} = require('../src/annotate');

const chapterDir = path.join(__dirname, '../chapter/');
const annotationDir = path.join(__dirname, '../dist/annotation/');
const annotationFiles = fs.readdirSync(annotationDir).filter((x) => Boolean(x.match(/^[0-9]+\.json$/))).map((x) => path.join(annotationDir, x));

describe('annotations', () => {
  annotationFiles.map((filepath) => {
    const chapter = filepath.match(/\/([0-9]+)\.json$/)[1];
    const annotations = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    const html = fs.readFileSync(path.join(chapterDir, `${chapter}.html`), 'utf8');
    const dom = new jsdom(html);
    const content = dom.window.document.getElementById('storycontent');
    const paragraphs = Array.from(content.getElementsByTagName('p'));

    // jsdom doesn't provide inner text, do some mangling that hopefully
    // doesn't make this test worthless
    paragraphs.map((p) => (p.innerText = p.textContent.replace(/ ?\r?\n ?/, ' ')));

    describe(`Chapter ${chapter}`, () => {

      annotations.map((a, annotationNumber) => {
        describe(`Annotation ${annotationNumber}`, () => {
          it('text uniquely matches lines', () => {
            const matches = find_matches(a.text, paragraphs);
            matches.map((x, fragmentNumber) => {
              assert.strictEqual(x.length, 1, `Fragment ${fragmentNumber} matches ${x.length} lines.`);
            });
          });

          it('tags are valid', () => {
            // TODO: put valid tags into actual code somewhere
            const validTags = [
              'foreshadowing',
              'consequence',
              'reference',
              'departure',
              'original',
              'speculation',
              'background',
              'spoiler',
            ];

            assert.notStrictEqual(a.tags.length, 0, 'Annotation has no tags.');
            const invalidTags = a.tags.filter((tag) => !validTags.includes(tag));
            assert.strictEqual(invalidTags.length, 0, `Invalid tags: ${invalidTags.join(', ')}`);
          });

          it('links resolve', () => {
            // TODO: gotta have the other pages loaded
          });
        });
      });
    });
  });
});

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom').JSDOM;
const jsonschema = require('jsonschema');

const {find_matches} = require('../src/annotate');

const chapterDir = path.join(__dirname, '../chapter/');
const annotationDir = path.join(__dirname, '../dist/annotation/');

const annotationFiles =
  fs.readdirSync(annotationDir)
    .filter((x) => Boolean(x.match(/^[0-9]+\.json$/)))
    .map((x) => path.join(annotationDir, x));

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

const annotationsSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      tags: {type: 'array', items: {type: 'string', enum: validTags}},
      text: {type: 'array', items: {type: 'string'}},
      note: {type: 'string'},
    },
    additionalProperties: false,
  },
};

describe('annotations', () => {
  const annotationValidator = new jsonschema.Validator();

  annotationFiles.forEach((filepath) => {
    const chapter = filepath.match(/\/([0-9]+)\.json$/)[1];
    const annotations = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    const html = fs.readFileSync(path.join(chapterDir, `${chapter}.html`), 'utf8');
    const dom = new jsdom(html);
    const content = dom.window.document.getElementById('storycontent');
    const paragraphs = Array.from(content.getElementsByTagName('p'));

    // jsdom doesn't provide inner text, do some mangling that hopefully
    // doesn't make this test worthless
    paragraphs.forEach((p) => (p.innerText = p.textContent.replace(/ ?\r?\n ?/, ' ')));

    describe(`Chapter ${chapter}`, () => {
      it('annotations match schema', () => {
        const result = annotationValidator.validate(annotations, annotationsSchema);
        assert.strictEqual(result.errors.length, 0,
          `Schema validation failed:\n${result.errors.map((x) => x.stack).join('\n')}`);
      });

      annotations.forEach((a, annotationNumber) => {
        describe(`Annotation ${annotationNumber}`, () => {
          it('text uniquely matches lines', () => {
            const matches = find_matches(a.text, paragraphs);
            matches.forEach((x, fragmentNumber) => {
              assert.strictEqual(x.length, 1, `Fragment ${fragmentNumber} matches ${x.length} lines.`);
            });
          });

          it('links resolve', () => {
            // TODO: gotta have the other pages loaded
          });
        });
      });
    });
  });
});

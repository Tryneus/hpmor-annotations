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

const schema = {
  type: 'array',
  required: true,
  items: {
    type: 'object',
    required: true,
    properties: {
      id: {type: 'string', required: true},
      tags: {type: 'array', required: true, items: {type: 'string', enum: validTags}},
      text: {type: 'array', required: true, items: {type: 'string'}},
      note: {type: 'string', required: true},
      disambiguation: {
        type: 'object',
        required: false,
        properties: {
          expect: {type: 'number', required: true},
          useIndex: {type: 'number', required: true},
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },
};

const parseChapterNumber = (path) => path.match(/\/([0-9]+)\.[A-z]+$/)[1];

describe('annotations', () => {
  const validator = new jsonschema.Validator();

  const chapters = annotationFiles.map((filepath) => {
    const html = fs.readFileSync(path.join(chapterDir, `${parseChapterNumber(filepath)}.html`), 'utf8');
    const dom = new jsdom(html);
    const content = dom.window.document.getElementById('storycontent');
    const paragraphs = Array.from(content.getElementsByTagName('p'));

    // jsdom doesn't provide inner text, do some mangling that hopefully
    // doesn't make this test worthless
    paragraphs.forEach((p) => (p.innerText = p.textContent.replace(/ ?\r?\n ?/g, ' ')));
    return paragraphs;
  });

  annotationFiles.forEach((filepath, i) => {
    describe(`Chapter ${parseChapterNumber(filepath)}`, () => {
      const annotations = JSON.parse(fs.readFileSync(filepath, 'utf8'));

      it('annotations match schema', () => {
        const result = validator.validate(annotations, schema);
        assert(
          result.errors.length == 0,
          `Schema validation failed:\n${result.errors.map((x) => x.stack).join('\n')}`,
        );
      });

      annotations.forEach((a, annotationNumber) => {
        describe(`Annotation ${annotationNumber}`, () => {
          it('text uniquely matches lines', () => {
            assert(
              find_matches(a, chapters[i]) !== null,
              `Could not find matches.`,
            );
          });

          // TODO: only generate this test if the note links to a chapter
          it('links uniquely resolve', () => {
          });
        });
      });
    });
  });
});

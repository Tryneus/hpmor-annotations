'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const jsdom = require('jsdom').JSDOM;
const jsonschema = require('jsonschema');

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
  type: 'object',
  required: true,
  propertyNames: {pattern: '^hpmor-[0-9]+-[0-9]+$'},
  additionalProperties: {
    type: 'object',
    required: ['id', 'tags', 'text', 'replacement', 'note', 'disambiguation'],
    additionalProperties: false,
    properties: {
      id: {type: 'string'},
      tags: {type: 'array', items: {type: 'string', enum: validTags}, minItems: 1},
      text: {type: 'string'},
      replacement: {type: 'string'},
      note: {type: 'string'},
      disambiguation: {
        type: 'object',
        required: ['expect', 'useIndex'],
        additionalProperties: false,
        properties: {
          expect: {type: 'number'},
          useIndex: {type: 'number'},
        },
      },
    },
  },
};

const parseChapterNumber = (path) => path.match(/\/([0-9]+)\.[A-z]+$/)[1];

describe('annotations', () => {
  const validator = new jsonschema.Validator();

  const chapters = annotationFiles.map((filepath) => {
    const html = fs.readFileSync(path.join(chapterDir, `${parseChapterNumber(filepath)}.html`), 'utf8');
    const dom = new jsdom(html);
    return dom.window.document.getElementById('storycontent').innerHTML.replace(/[\n ]+/g, ' ');
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

        // TODO: perform some extra validation, like id matches key and disambiguation index is less than number of expected matches
      });

      _.forEach(_.toPairs(annotations), ([id, a], annotationNumber) => {
        describe(`Annotation ${annotationNumber}: ${a.id}`, () => {
          it('text uniquely matches lines', () => {
            assert(
              chapters[i].includes(a.text),
              'Could not find matching text. Make sure inner tags like "<em>" are present.',
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

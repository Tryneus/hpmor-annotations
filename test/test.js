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
    required: ['id', 'tags', 'text', 'replacement', 'note', 'disambiguation', 'subjects'],
    additionalProperties: false,
    properties: {
      id: {type: 'string'},
      tags: {type: 'array', items: {type: 'string', enum: validTags}, minItems: 1},
      subjects: {type: 'array', items: {type: 'string'}},
      text: {type: 'string'},
      replacement: {type: 'string'},
      note: {type: 'string'},
      disambiguation: {
        type: 'object',
        required: ['expect', 'useIndex'],
        additionalProperties: false,
        properties: {
          expect: {type: 'integer', minimum: 1},
          useIndex: {type: 'integer', minimum: 0},
        },
      },
    },
  },
};

const parseChapterNumber = (path) => path.match(/\/([0-9]+)\.[A-z]+$/)[1];

const chapterCache = [];
const chapter = (i) => {
  if (!chapterCache[i]) {
    const filepath = path.join(chapterDir, `${i}.html`);
    const html = fs.readFileSync(path.join(chapterDir, `${parseChapterNumber(filepath)}.html`), 'utf8');
    const dom = new jsdom(html);
    chapterCache[i] = dom.window.document.getElementById('storycontent').innerHTML.replace(/[\n ]+/g, ' ');
  }
  return chapterCache[i];
};

const checkUnique = (text, html, expect) => {
  const searches = [];
  while (searches[searches.length - 1] !== -1) {
    searches.push(html.indexOf(text, (searches[searches.length - 1] + 1) || 0));
  }

  const indices = searches.filter((x) => x > 0);
  assert(indices.length > 0, 'Could not find matching text.');
  assert.notStrictEqual(indices.length, expect, 'Text matches the wrong number of places in the chapter.');
};

describe('annotations', () => {
  annotationFiles.forEach((filepath, i) => {
    describe(`Chapter ${parseChapterNumber(filepath)}`, () => {
      const annotations = JSON.parse(fs.readFileSync(filepath, 'utf8'));

      it('annotations match schema', () => {
        const validator = new jsonschema.Validator();
        const result = validator.validate(annotations, schema);
        assert(
          result.errors.length == 0,
          `Schema validation failed:\n${result.errors.map((x) => x.stack).join('\n')}`,
        );

        _.forEach(_.toPairs(annotations), ([id, a]) => {
          assert.strictEqual(id, a.id, 'Annotation ids are inconsistent.');
          assert(
            a.disambiguation.useIndex < a.disambiguation.expect,
            `Annotation ${id} disambiguation index is larger than expected matches.`,
          );
        });
      });

      _.forEach(_.toPairs(annotations), ([id, a], annotationNumber) => {
        describe(`Annotation ${annotationNumber}: ${a.id}`, () => {
          it('text uniquely matches lines', () => {
            checkUnique(a.text, chapter(i + 1));
          });

          const brackets = a.note.match(/\{/g) || [];
          const linkRegex = RegExp('\{([0-9]+)\/([^\}]+)\}', 'g');
          const matches = brackets.reduce((acc) => {
            acc.push(linkRegex.exec(a.note) || []);
            return acc;
          }, []);

          matches.forEach((match) => {
            it(`Link ${i}: ${match[1] ? 'Chapter ' + match[1] : 'unknown chapter'}`, () => {
              assert(match.length === 3, 'Unexpected link format.');
              const chapterNumber = parseInt(match[1]);
              checkUnique(match[2], chapter(chapterNumber));
            });
          });
        });
      });
    });
  });
});

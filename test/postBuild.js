'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const eslint = require('eslint');
const jsdom = require('jsdom').JSDOM;
const jsonschema = require('jsonschema');

const chapterDir = path.join(__dirname, '../chapter/');
const annotationDir = path.join(__dirname, '../dist/annotation/');

const annotationFiles =
  fs.readdirSync(annotationDir)
    .filter((x) => Boolean(x.match(/^[0-9]+\.js$/)))
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

const annotationSchema = {
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

const anchorsSchema = {
  type: 'object',
  required: true,
  propertyNames: {pattern: '^hpmor-[0-9]+-[0-9]+-[0-9]+$'},
  additionalProperties: {
    type: 'object',
    required: ['id', 'annotationId', 'annotationChapter', 'text', 'disambiguation'],
    additionalProperties: false,
    properties: {
      id: {type: 'string'},
      annotationId: {type: 'string'},
      annotationChapter: {type: 'string'},
      text: {type: 'string'},
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
  assert(indices.length > 0, `Could not find matching text.\n${text}`);
  assert.notStrictEqual(indices.length, expect, 'Text matches the wrong number of places in the chapter.');
};

describe('annotations', () => {
  annotationFiles.forEach((filepath) => {
    const chapterNumber = parseChapterNumber(filepath);
    describe(`Chapter ${chapterNumber}`, () => {
      const {annotations, anchors} = require(filepath);

      it('anchors match schema', () => {
        const validator = new jsonschema.Validator();
        const result = validator.validate(anchors, anchorsSchema);
        assert(
          result.errors.length == 0,
          `Schema validation failed:\n${result.errors.map((x) => x.stack).join('\n')}`,
        );

        _.forEach(_.toPairs(anchors), ([id, a]) => {
          assert.strictEqual(id, a.id, 'Anchor ids are inconsistent.');
          assert(
            a.disambiguation.useIndex < a.disambiguation.expect,
            `Anchor ${id} disambiguation index is larger than expected matches.`,
          );
          assert(
            id.startsWith(a.annotationId),
            `Anchor ${id} should be a postfixed string of the annotation ${a.annotationId}`,
          );
        });
      });

      it('annotations match schema', () => {
        const validator = new jsonschema.Validator();
        const result = validator.validate(annotations, annotationSchema);
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

      Object.values(annotations).map((a) => {
        describe(`Annotation ${a.id}`, () => {
          it('text uniquely matches lines', () => {
            checkUnique(a.text, chapter(chapterNumber));
          });

          const brackets = (a.note && a.note.match(/\{/g)) || [];
          const linkRegex = RegExp('\\{([0-9]+)/([^}]+)\\}', 'g');
          const matches = brackets.reduce((acc) => {
            acc.push(linkRegex.exec(a.note) || []);
            return acc;
          }, []);

          // TODO: we can test this via 'anchors'
          matches.forEach((match, i) => {
            it(`Link ${i + 1}: ${match[1] ? 'Chapter ' + match[1] : 'unknown chapter'}`, () => {
              assert(match.length === 3, 'Unexpected link format.');
              const targetChapterNumber = parseInt(match[1]);
              checkUnique(match[2], chapter(targetChapterNumber));
            });
          });

          // TODO: test that all reference/foreshadowing/background notes contain links
          // TODO: test that we don't have raw links
        });
      });
    });
  });
});

describe('eslint', () => {
  before(function () {
    const dirs = [
      path.join(__dirname, '../src'),
      path.join(__dirname, '../script'),
      path.join(__dirname, '../test'),
    ];

    const engine = new eslint.CLIEngine();
    this.results = engine.executeOnFiles(dirs);
  });

  it('no eslint errors', function () {
    const errorsByFile = _.fromPairs(
      this.results.results
        .filter((x) => x.errorCount > 0)
        .map((x) => [x.filePath, x.messages])
    );

    const lines = _.flatMap(
      errorsByFile,
      (errors, file) => {
        const errorLines = errors.map((x) => {
          return `    ${x.line}:${x.column}\t${x.message}\t(${x.ruleId})`;
        });
        return [`  ${file}:`].concat(errorLines);
      }
    );

    const message = ['ESLint errors', ''].concat(lines).concat(['']).join('\n');
    assert.strictEqual(this.results.errorCount, 0, message);
  });

  it('no eslint warnings', function () {
    const message = 'fail';
    assert.strictEqual(this.results.warningCount, 0, message);
  });
});

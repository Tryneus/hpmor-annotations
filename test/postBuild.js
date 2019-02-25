'use strict';

const assert = require('assert');

const _ = require('lodash');
const jsonschema = require('jsonschema');

const {
  processedAnnotations,
  chapter,
  checkUnique,
} = require('./common.js');

const schema = require('./schema.js');

describe('annotations', () => {
  processedAnnotations().forEach(({id, data: {annotations, anchors}}) => {
    describe(`chapter ${id}`, () => {
      it('anchors match schema', () => {
        const validator = new jsonschema.Validator();
        const result = validator.validate(anchors, schema.anchors);
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
        const result = validator.validate(annotations, schema.annotations);
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
            checkUnique(a.text, chapter(id));
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

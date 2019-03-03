'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

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
          if (a.annotationId) {
            assert(
              id.startsWith(a.annotationId),
              `Anchor ${id} should be a postfixed string of the annotation ${a.annotationId}`,
            );
          }
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

      Object.values(anchors).map((a) => {
        describe(`Anchor ${a.id}`, () => {
          it('uniquely matches', () => {
            const region = a.title ? chapter(id).title : chapter(id).text;
            checkUnique(a.text, region);
          });
        });
      });

      Object.values(annotations).map((a) => {
        describe(`Annotation ${a.id}`, () => {
          it('text uniquely matches lines', () => {
            const region = a.title ? chapter(id).title : chapter(id).text;
            checkUnique(a.text, region);
          });

          const brackets = (a.note && a.note.match(/\{/g)) || [];
          const linkRegex = RegExp('\\{([0-9]+)/([^}]+)\\}', 'g');
          const matches = brackets.reduce((acc) => {
            acc.push(linkRegex.exec(a.note) || []);
            return acc;
          }, []);

          matches.forEach((match, i) => {
            it(`Link ${i + 1}: ${match[1] ? 'Chapter ' + match[1] : 'unknown chapter'}`, () => {
              assert(match.length === 3, 'Unexpected link format.');
              // const targetChapterNumber = parseInt(match[1]);
              // TODO: test that there exists an anchor for each link id
            });
          });

          // TODO: test that all reference/foreshadowing/background notes contain links
          // TODO: test that we don't have raw links
        });
      });
    });
  });
});

describe('topics', () => {
  // Find all topics mentioned in annotations
  const topics =
    _.uniq(
      _.flatMap(
        _.flatMap(
          processedAnnotations(),
          (x) => Object.values(x.data.annotations),
        ),
        (x) => x.topics.map((topic) => topic[0]),
      ),
    );

  // TODO: test that all topics/subsections have at least one mention
  topics.forEach((topic) => {
    describe(topic, () => {
      const topicDir = path.join(__dirname, '..', 'dist', 'topic');

      it('has a topic page', () => {
        assert(
          fs.existsSync(path.join(topicDir, `${topic}.md`)),
          `Expected topic file dist/topic/${topic}.md does not exist.`,
        );
      });
    });
  });
});

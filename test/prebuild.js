'use strict';

const assert = require('assert');
const path = require('path');

const _ = require('lodash');
const eslint = require('eslint');
const jsonschema = require('jsonschema');

const {rawAnnotations} = require('./common.js');
const schema = require('./schema.js');

describe('raw annotations', () => {
  rawAnnotations().forEach(({id, data}) => {
    describe(`chapter ${id}`, () => {
      it('matches schema', () => {
        const validator = new jsonschema.Validator();
        const result = validator.validate(data, schema.rawAnnotations);
        assert(
          result.errors.length == 0,
          `Schema validation failed:\n${result.errors.map((x) => x.stack).join('\n')}`,
        );
      });
    });
  });
});

describe('eslint', () => {
  before(function () {
    const dirs = [
      path.join(__dirname, '..', 'src'),
      path.join(__dirname, '..', 'script'),
      path.join(__dirname, '..', 'test'),
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

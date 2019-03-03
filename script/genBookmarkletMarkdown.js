'use strict';

const _ = require('lodash');
const util = require('util');
const path = require('path');

const fs =
  _.mapValues(
    _.pick(
      require('fs'),
      ['readFile', 'writeFile'],
    ),
    util.promisify,
  );

const sourceFile = path.join(__dirname, '..', 'dist', 'bookmarklet.js');
const outputFile = path.join(__dirname, '..', 'dist', 'bookmarklet.md');

Promise.resolve().then(() => {
  return fs.readFile(sourceFile, 'utf8').catch((err) => {
    throw new Error(`Error reading source file (${sourceFile}): ${err}`);
  });
}).then((source) => {
  // The minifier we're using seems to fuck up the bookmarklet code a bit, so wrap it
  const wrapped = source
    .replace(/^!function/, '(function')
    .replace(/\}\(\)$/, '})()');

  // To embed the bookmarklet in the github pages markdown, we need to URI-encode it
  const escaped = encodeURIComponent(wrapped);

  return fs.writeFile(outputFile, 'javascript:' + escaped).catch((err) => {
    throw new Error(`Error writing output file (${outputFile}): ${err}`);
  });
}).then(() => {
  console.log('Generated escaped markdown for bookmarklet:', outputFile);
}).catch((err) => {
  console.log(err);
});

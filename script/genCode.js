'use strict';

const _ = require('lodash');
const path = require('path');
const util = require('util');
const butternut = require('butternut');

const fs =
  _.mapValues(
    _.pick(
      require('fs'),
      ['readFile', 'writeFile', 'readdir']
    ),
    util.promisify
  );

const sourceDir = path.join(__dirname, '..', 'src');
const outputDir = path.join(__dirname, '..', 'dist');

Promise.resolve().then(() => {
  return fs.readdir(sourceDir).catch((err) => {
    throw new Error(`Error reading src directory (${sourceDir}): ${err}`);
  });
}).then((filelist) => {
  const files = filelist.filter((x) => Boolean(x.match(/\.js$/)));
  return Promise.all(files.map((filename) => {
    const sourceFile = path.join(sourceDir, filename);
    const outputFile = path.join(outputDir, filename);
    const outputMapFile = path.join(outputDir, `${filename}.map`);

    return fs.readFile(sourceFile, 'utf8').catch((err) => {
      throw new Error(`Error reading source file (${sourceFile}): ${err}`);
    }).then((source) => {
      const {code, map} = butternut.squash(source, {});

      return Promise.all([
        fs.writeFile(outputFile, code).catch((err) => {
          throw new Error(`Error writing output (${outputFile}): ${err}`);
        }),
        fs.writeFile(outputMapFile, map).catch((err) => {
          throw new Error(`Error writing map output (${outputMapFile}): ${err}`);
        }),
      ]).then(() => {
        console.log('Generated minified source:', outputFile);
      });
    });
  }));
}).catch((err) => {
  console.log(err);
});

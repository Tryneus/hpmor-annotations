'use strict';

const _ = require('lodash');
const util = require('util');
const path = require('path');
const scrape = require('website-scraper');

const fs =
  _.mapValues(
    _.pick(
      require('fs'),
      ['symlink'],
    ),
    util.promisify,
  );

const outputDir = path.join(__dirname, '..', 'chapter');
const urls = Array.from(Array(122).keys()).map((i) =>
  ({url: `https://www.hpmor.com/chapter/${i + 1}`, filename: `${i + 1}.html`}),
);

Promise.resolve().then(() => {
  return scrape({urls, directory: outputDir, requestConcurrency: 1}).catch((err) => {
    throw new Error(`Failed to download chapters: ${err}`);
  });
}).then(() => {
  // Links to other chapters leave out the .html, and I don't want to run a
  // real webserver locally, so just make symlinks to avoid solving this nicely.
  return Promise.all(
    urls.map((info) => {
      const htmlFile = path.join(outputDir, info.filename);
      const link = path.join(outputDir, info.filename.replace('.html', ''));
      return fs.symlink(htmlFile, link);
    })
  );
}).catch((err) => {
  console.log(err);
});

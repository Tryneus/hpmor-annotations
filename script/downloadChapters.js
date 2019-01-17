'use strict'

const fs = require('fs');
const path = require('path');
const scrape = require('website-scraper');

const outputDir = path.join(__dirname, '../chapter');

async function downloadChapters() {
  const urls = Array.from(Array(122).keys()).map((i) =>
    ({url: `https://www.hpmor.com/chapter/${i + 1}`, filename: `${i + 1}.html`}),
  );

  try {
    await scrape({urls, outputDir, requestConcurrency: 1});
  } catch (e) {
    console.log('Failed to download chapters:', e.message);
    return;
  }

  // Links to other chapters leave out the .html, and I don't want to run a
  // real webserver locally, so just make symlinks to avoid solving this nicely.
  urls.map((info) => {
    const htmlFile = path.join(outputDir, info.filename);
    const link = path.join(outputDir, info.filename.replace('.html', ''));
    fs.symlinkSync(htmlFile, link);
  });
}

downloadChapters();

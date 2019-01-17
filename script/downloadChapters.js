'use strict'

const scrape = require('website-scraper');
const path = require('path');

async function downloadChapters() {
  const directory = path.join(__dirname, '../chapter');
  const urls = Array.from(Array(122).keys()).map((i) =>
    ({url: `https://www.hpmor.com/chapter/${i + 1}`, filename: `${i + 1}.html`}),
  );

  try {
    await scrape({urls, directory, requestConcurrency: 1});
  } catch (e) {
    console.log('Failed to download chapters:', e.message);
  }
}

downloadChapters();

'use strict';

const _ = require('lodash');
const util = require('util');
const path = require('path');

const fs =
  _.mapValues(
    _.pick(
      require('fs'),
      ['mkdir', 'readdir', 'writeFile'],
    ),
    util.promisify,
  );

const annotationDir = path.join(__dirname, '..', 'dist', 'annotation');
const topicSourceDir = path.join(__dirname, '..', 'topic');
const topicDestDir = path.join(__dirname, '..', 'dist', 'topic');
const listMarkdownFile = path.join(__dirname, '..', 'dist', 'topics.md');

const loadJsFiles = (dir, pattern) => {
  return fs.readdir(dir).catch((err) => {
    throw new Error(`Error listing directory (${dir}): ${err}`);
  }).then((fileList) => {
    const files = fileList.filter((x) => Boolean(x.match(pattern)));
    return files.reduce((acc, filename) => {
      const sourceFile = path.join(dir, filename);
      const key = filename.match(/^(.*)\.js$/)[1];
      acc[key] = require(sourceFile);
      return acc;
    }, {});
  });
};

Promise.resolve().then(() => {
  return fs.mkdir(topicDestDir, {recursive: true}).catch((err) => {
    throw new Error(`Error when creating topic directory (${topicDestDir}): ${err}`);
  });
}).then(() => {
  return Promise.all([
    loadJsFiles(annotationDir, /^[0-9]+\.js$/),
    loadJsFiles(topicSourceDir, /^[^.].*\.js$/),
  ]);
}).then(([annotations, topics]) => {
  const topicPromises = Object.entries(topics).map(([topic, info]) => {
    const outputFile = path.join(topicDestDir, `${topic}.md`);

    const markdown = `
# ${info.title}

${info.description}

${annotations.length}
    `;

    return fs.writeFile(outputFile, markdown.trim()).catch((err) => {
      throw new Error(`Error when writing topic (${outputFile}): ${err}`);
    }).then(() => {
      console.log('Generated topic markdown:', outputFile);
    });
  });

  const listMarkdown = Object.entries(topics).map(([topic, info]) =>
    `* [${info.title}](${path.join('dist', 'topic', topic)})`
  ).join('\n');

  const listPromise = fs.writeFile(listMarkdownFile, listMarkdown).catch((err) => {
    throw new Error(`Error when writing topic list (${listMarkdownFile}): ${err}`);
  }).then(() => {
    console.log(`Generated topic list (${Object.entries(topics).length}):`, listMarkdownFile);
  });

  return Promise.all(_.concat(topicPromises, [listPromise]));
}).catch((err) => {
  console.log(err);
});

'use strict';

const fs = require('fs');
const path = require('path');

const annotationDir = path.join(__dirname, '..', 'dist', 'annotation');
const topicSourceDir = path.join(__dirname, '..', 'topic');
const topicDestDir = path.join(__dirname, '..', 'dist', 'topic');
const listMarkdownFile = path.join(__dirname, '..', 'dist', 'topics.md');

fs.mkdirSync(topicDestDir, {recursive: true});

// Load the annotations from the easy-to-edit JS file and output a JSON file for
// consumption
fs.readdir(annotationDir, (err, filelist) => {
  if (err) { throw err; }
  const files = filelist.filter((x) => Boolean(x.match(/^[0-9]+\.js$/)));

  const annotations = files.reduce((acc, filename) => {
    const sourceFile = path.join(annotationDir, filename);
    const chapter = filename.match(/^([0-9]+)\.js$/)[1];
    acc[chapter] = require(sourceFile);
    return acc;
  }, {});

  fs.readdir(topicSourceDir, (err, filelist) => {
    if (err) { throw err; }
    const files = filelist.filter((x) => Boolean(x.match(/.*\.js$/)));

    const topics = files.reduce((acc, filename) => {
      const sourceFile = path.join(topicSourceDir, filename);
      const topic = filename.match(/^(.*)\.js$/)[1];
      acc[topic] = require(sourceFile);
      return acc;
    }, {});

    Object.entries(topics).forEach(([topic, info]) => {
      const outputFile = path.join(topicDestDir, `${topic}.md`);

      const markdown = `
# ${info.title}

${info.description}

${annotations.length}
      `;

      fs.writeFileSync(outputFile, markdown.trim());
      console.log('Generated topic markdown:', outputFile);
    });

    const listMarkdown = Object.entries(topics).map(([topic, info]) =>
      `* [${info.title}](${path.join('dist', 'topic', topic)})`
    ).join('\n');


    fs.writeFileSync(listMarkdownFile, listMarkdown);
    console.log(`Generated topic list (${Object.entries(topics).length}):`, listMarkdownFile);
  });
});

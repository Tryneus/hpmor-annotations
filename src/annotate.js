function annotate() {
  const frame = document.getElementById('hpmor-annotations-frame');
  const overlay = document.getElementById('hpmor-annotations-overlay');

  if (!frame) {
    console.error('hpmor-annotations: Could not find iframe.');
  } else {
    const href = frame.contentWindow.location.href;
    const matches = href.match(/\/([0-9]+)(\.html)?$/);
    const chapter = matches && parseInt(matches[1]);
    const content = frame.contentDocument.getElementById('storycontent');

    if (!overlay) {
      console.error('hpmor-annotations: Could not find overlay.');
    } else if (!chapter) {
      console.error('hpmor-annotations: Could not determine chapter.', href);
    } else if (!content) {
      console.error('hpmor-annotations: Could not find story content.');
    } else {
      fetch_annotations(chapter, (data) => apply_annotations(content, overlay, data));
    }
  }
}

function fetch_annotations(chapter, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `https://tryneus.github.io/hpmor-annotations/dist/annotation/${chapter}.json`);
  xhr.send();
  xhr.onerror = () => {
    console.error('hpmor-annotations: Could not load annotations.');
  };

  xhr.onload = () => {
    if (xhr.status !== 200) {
      console.error('hpmor-annotations: Loading annotations failed, status:', xhr.status);
    } else {
      callback(parse_annotations(xhr.response));
    }
  };
}

function parse_annotations(raw) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('hpmor-annotations: Failed to parse annotations', err);
  }
}

function find_matches(annotation, paragraphs) {
  const {id, text, disambiguation} = annotation;

  // For each line that we're looking for, find the matching paragraphs
  const indices = Array.from(Array(paragraphs.length).keys());
  const matches = text.map((line, i) => {
    if (text.length > 1) {
      if (i === 0) {
        return indices.filter((x) => paragraphs[x].innerText.endsWith(line));
      } else if (i === text.length - 1) {
        return indices.filter((x) => paragraphs[x].innerText.startsWith(line));
      } else {
        return indices.filter((x) => paragraphs[x].innerText === line);
      }
    } else {
      return indices.filter((x) => paragraphs[x].innerText.includes(line));
    }
  });

  if (matches[0].length === 0) {
    console.error(`hpmor-annotations: Could not find text for annotation ${id}.`);
    return null;
  }

  // For each match that we found, find any sets of in-order paragraphs
  const startIndices = matches[0].filter((startIndex) => {
    for (let i = 1; i < matches.length; ++i) {
      if (!matches[i].includes(startIndex + i)) {
        return false;
      }
    }
    return true;
  });

  // Disambiguate from the configuration on the annotation, if provided
  if (startIndices.length === 0) {
    console.error(`hpmor-annotations: Could not find text for annotation ${id}.`);
    return null;
  } else if (disambiguation) {
    if (startIndices.length === disambiguation.expect) {
      return startIndices[disambiguation.useIndex];
    } else {
      console.error(`hpmor-annotations: Unexpected number of matches for annotation ${id}.` +
        ` Found ${startIndices.length}, expected ${disambiguation.expect}.`);
      return null;
    }
  } else if (startIndices.length === 1) {
    // The text uniquely matched the text in one spot, return the index of the starting paragraph
    return startIndices[0];
  } else {
    console.error(`hpmor-annotations: Found multiple matches for annotation ${id}.` +
      ` Matching paragraph indices: ${startIndices.join(', ')}.`);
    return null;
  }
}

function apply_annotations(content, overlay, annotations) {
  const paragraphs = Array.from(content.getElementsByTagName('p'));
  annotations.map((annotation, j) => {
    const matches = find_matches(annotation, paragraphs);
    console.log(`annotation ${j}:`, matches.map((x, i) => [annotation.text[i], x]));
  });
}

// Dev function for ease-of-use
// TODO: remove this later
function reload_script() {
  const scripts =
    Array.from(document.getElementsByTagName('script'))
      .filter((x) => Boolean(x.src.match(/\/annotate.js$/)));

  if (scripts.length === 0) {
    console.error('Could not find script to reload.');
  } else if (scripts.length > 1) {
    console.error('Found too many matching script elements.', scripts);
  } else {
    const oldScript = scripts[0];
    const newScript = document.createElement('script');
    newScript.src = oldScript.src.replace('dist', 'src');

    oldScript.parentNode.removeChild(oldScript);
    document.body.appendChild(newScript);
  }
}

// Export everything for unit tests
if (module && module.exports) {
  module.exports = {
    annotate,
    fetch_annotations,
    parse_annotations,
    find_matches,
    apply_annotations,
    reload_script,
  };
}

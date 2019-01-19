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
      fetchAnnotations(chapter, (annotations) => {
        // Normalize the HTML so we can find and replace
        innerHTML = content.innerHTML.replace(/[\n ]+/g, ' ');
        Object.values(annotations).forEach((annotation) => {
          innerHTML = innerHTML.replace(annotation.text, annotation.replacement);
        });
        content.innerHTML = innerHTML;
        clearNotes(content);
        addNotes(content, annotations);
      });
    }
  }
}

function getAnnotationSpans(content) {
  return Array.from(content.getElementsByTagName('span'))
    .filter((span) =>
      span.attributes.annotation &&
        span.attributes.annotation.value.match(/^hpmor-[0-9]+-[0-9]+$/)
    );
}

function fetchAnnotations(chapter, callback) {
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
      callback(parseAnnotations(xhr.response));
    }
  };
}

function parseAnnotations(raw) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('hpmor-annotations: Failed to parse annotations', err);
  }
}

function clearNotes(content) {
  getAnnotationSpans(content).forEach((span) => {
    span.outerHTML = span.innerHTML;
  });

  // TODO: deal with hidden note elements
}

function addNotes(content, annotations) {
  const colors = {
    'foreshadowing': '#888',
    'consequence': '#f6f',
    'reference': '#66f',
    'departure': '#f90',
    'original': '#6f0',
    'speculation': '#e0f',
    'background': '#30f',
    'spoiler': '#f00',
  };

  getAnnotationSpans(content).forEach((span) => {
    const id = span.attributes.annotation.value;
    const annotation = annotations[id];

    if (!annotation) {
      console.error('hpmor-annotations: Could not find annotation', id);
      return;
    }

    const color = colors[annotation.tags[0]];
    span.style['text-decoration'] = `dotted ${color} underline`;
  });
}

// Dev function for ease-of-use
// TODO: remove this later
function reloadScript() {
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
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    annotate,
    fetchAnnotations,
    parseAnnotations,
    addNotes,
    reloadScript,
  };
}

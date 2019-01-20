function annotate() {
  const frame = document.getElementById('hpmor-annotations-frame');
  const notes = frame.contentDocument.getElementById('hpmor-annotations-notes');
  // const overlay = document.getElementById('hpmor-annotations-overlay');

  if (!frame) {
    console.error('hpmor-annotations: Could not find iframe.');
  } else {
    const href = frame.contentWindow.location.href;
    const matches = href.match(/\/([0-9]+)(\.html)?$/);
    const chapter = matches && parseInt(matches[1]);
    const content = frame.contentDocument.getElementById('storycontent');

    if (!notes) {
      console.error('hpmor-annotations: Could not find notes.');
    } else if (!chapter) {
      console.error('hpmor-annotations: Could not determine chapter.', href);
    } else if (!content) {
      console.error('hpmor-annotations: Could not find story content.');
    } else {
      fetchAnnotations(chapter, (annotations) => {
        clearNotes(content, notes);

        // Normalize the HTML so we can find and replace
        innerHTML = content.innerHTML.replace(/[\n ]+/g, ' ');

        // Wrap the annotated text in spans so we can underline and expand on click
        Object.values(annotations).forEach((annotation) => {
          innerHTML = innerHTML.replace(annotation.text, annotation.replacement);
        });
        content.innerHTML = innerHTML;

        addNotes(content, notes, annotations);
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

function clearNotes(content, notes) {
  getAnnotationSpans(content).forEach((span) => {
    span.outerHTML = span.innerHTML;
  });

  notes.innerHTML = '';
}

function addNotes(content, notes, annotations) {
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

  // Collect the spans that we will be adding the notes to, apply style
  const items = getAnnotationSpans(content).map((span) => {
    const id = span.attributes.annotation.value;
    const annotation = annotations[id];

    if (!annotation) {
      console.error('hpmor-annotations: Could not find annotation', id);
      return null;
    }

    const color = colors[annotation.tags[0]];
    span.style['text-decoration'] = `dotted ${color} underline`;

    span.onclick = toggleNote;
    // TODO: onhover handler to show tooltip with tags

    return {annotation, span};
  });

  // For each annotation, add a div which is hidden until the annotation is clicked
  Object.values(annotations).forEach((a) => {
    const note = document.createElement('div');
    note.id = `${a.id}-note`;
    note.style.position = 'absolute';
    note.style.display = 'none';
    note.onclick = () => (note.style.display = 'none');
    note.innerHTML = `
      <div style="position: absolute;right: 0;">
        <div style="font: all-small-caps 600 15px PT\\ Sans, Georgia;">${a.tags.join(' ')}</div>
        <div>${a.note}</div>
      </div>`;
    notes.appendChild(note);
  });
}

function getNoteDiv(id) {
  return document.getElementById('hpmor-annotations-frame').contentDocument.getElementById(`${id}-note`);
}

function toggleNote(ev) {
  // TODO: are these necessary?
  ev.preventDefault();
  ev.stopPropagation();

  const span = ev.currentTarget;
  const id = span.attributes.annotation.value;
  const note = getNoteDiv(id);

  activeNote = id;
  note.style.display = null;
  positionNote(note, id);
}

function positionNote(note, id) {
  const frame = document.getElementById('hpmor-annotations-frame');
  const content = frame.contentDocument.getElementById('storycontent');
  const spans = Array.from(frame.contentDocument.getElementsByTagName('span'))
    .filter((span) =>
      span.attributes.annotation &&
        span.attributes.annotation.value === id);

  // Find the top/bottom offsets of the annotation
  const dimensions = spans.reduce((acc, span) => {
    const {top, bottom} = span.getBoundingClientRect();
    return {
      top: (acc && (acc.top < top ? acc.top : top)) || top,
      bottom: (acc && (acc.bottom > bottom ? acc.bottom : bottom)) || bottom,
    };
  }, {});

  // Position the note so that it sits next to the annotated text
  note.style.left = '0px';
  note.style.width = `${content.getBoundingClientRect().left + frame.contentWindow.pageXOffset}px`;
  note.style.top = `${dimensions.top + frame.contentWindow.pageYOffset}px`;
  note.style.height = `${dimensions.bottom - dimensions.top}px`;

  // TODO: use an overlay layout if not enough x space
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

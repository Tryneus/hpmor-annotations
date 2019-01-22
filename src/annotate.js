(function() {
  // This whole thing could probably be simplified by using more globals, but w/e
  // Used to track the currently displayed note
  let activeNote;

  const colors = {
    'foreshadowing': '#aaa',
    'consequence': '#f6f',
    'reference': '#66f',
    'departure': '#f90',
    'original': '#af0',
    'speculation': '#e0f',
    'background': '#30f',
    'spoiler': '#f00',
  };

  function handleFrameLoad() {
    const frame = document.getElementById('hpmor-annotations-frame');
    const innerDocument = frame.contentDocument;

    // Rewrite links to open in this frame
    Array.from(innerDocument.getElementsByTagName('a')).map((x) => {
      if (x.target === '_top') {
        x.target = '_self';
      }
    });

    // The chapter select drop-down navigates from the top as well
    innerDocument.getElementById('nav-form-top').target = '_self';

    // Reposition the active note if the frame is resized
    window.addEventListener('resize', positionNote);

    // Update the window title/url and get the chapter number for annotations
    window.history.replaceState({}, '', frame.contentWindow.location.href);
    document.title = innerDocument.title;

    activeNote = null;
    annotate();
  }

  function installFrame() {
    // Reload the page in an iframe, change links so that they only navigate the
    // iframe instead of the top-level window, then apply the annotations to the
    // iframe story contents any time a new page is loaded.
    // TODO: do we need to / can we do some cleanup if the user navigates away from hpmor?
    if (!document.getElementById('hpmor-annotations-frame')) {
      while (document.body.children.length > 0) {
        document.body.removeChild(document.body.children[0]);
      }

      const frame = document.createElement('iframe');
      frame.id = 'hpmor-annotations-frame';

      // TODO: is it possible to move the existing body into the iframe without reloading?
      frame.src = window.location.href;
      document.body.appendChild(frame);
    }

    const frame = document.getElementById('hpmor-annotations-frame');
    frame.style.width = '100vw';
    frame.style.height = '100vh';
    frame.style.border = 'none';

    frame.addEventListener('load', handleFrameLoad);

    return frame;
  }

  function installNotes(innerDocument, annotations) {
    const oldNotes = innerDocument.getElementById('hpmor-annotations-notes');

    if (oldNotes) {
      oldNotes.parentNode.removeChild(oldNotes);
    }

    const notes = innerDocument.createElement('div');
    notes.id = 'hpmor-annotations-notes';
    innerDocument.body.insertBefore(notes, innerDocument.body.childNodes[0]);

    // For each annotation, add a div which is hidden until the annotation is clicked
    Object.values(annotations).forEach((annotation) => {
      const color = colors[annotation.tags[0]];
      const note = document.createElement('div');
      note.id = `${annotation.id}-note`;
      note.className = 'hpmor-annotations-note';
      note.onclick = dismissNote;
      note.innerHTML = `
        <div class="hpmor-annotations-note-container">
          <div>
            <div class="hpmor-annotations-note-tags" style="background: ${color}">${annotation.tags.join(' / ')}</div>
            <div class="hpmor-annotations-note-text" style="border-color: ${color}">${annotation.note}</div>
          </div>
          <div class="hpmor-annotations-note-bracket" style="border-color: ${color}"></div>
        </div>`;
      notes.appendChild(note);
    });
  }

  function installSpans(content, annotations) {
    getAnnotationSpans(content).forEach((span) => {
      span.outerHTML = span.innerHTML;
    });

    // Normalize the HTML so we can find and replace
    let innerHTML = content.innerHTML.replace(/[\n ]+/g, ' ');

    // Wrap the annotated text in spans so we can underline and expand on click
    Object.values(annotations).forEach((annotation) => {
      // TODO: this is only replacing the first occurence, use expect/useIndex
      innerHTML = innerHTML.replace(annotation.text, annotation.replacement);
    });

    content.innerHTML = innerHTML;

    getAnnotationSpans(content).forEach((span) => {
      const id = span.attributes.annotation.value;
      const annotation = annotations[id];

      if (!annotation) {
        console.error('hpmor-annotations: Could not find annotation', id);
        return null;
      }

      const color = colors[annotation.tags[0]];
      span.style['text-decoration-color'] = color;

      span.onclick = (ev) => toggleNote(id, ev);
      // TODO: onhover handler to show tooltip with tags
    });
  }

  function annotate() {
    const frame = installFrame();

    if (!frame) {
      console.error('hpmor-annotations: Could not find iframe.');
    } else {
      const href = frame.contentWindow.location.href;
      const matches = href.match(/\/([0-9]+)(\.html)?$/);
      const chapter = matches && parseInt(matches[1]);
      const content = frame.contentDocument.getElementById('storycontent');

      if (!chapter) {
        console.error('hpmor-annotations: Could not determine chapter.', href);
      } else if (!content) {
        console.error('hpmor-annotations: Could not find story content.');
      } else {
        installCss(frame.contentDocument);

        fetchAnnotations(chapter, (annotations) => {
          const innerContent = wrapContent(frame.contentDocument, content);
          installSpans(innerContent, annotations);
          installNotes(frame.contentDocument, annotations);
        });
      }
    }
  }

  function installCss(frameDocument) {
    if (!frameDocument.getElementById('hpmor-annotations-css')) {
      const styleElement = frameDocument.createElement('style');
      styleElement.id = 'hpmor-annotations-css';
      styleElement.type = 'text/css';
      frameDocument.head.appendChild(styleElement);
    }

    const css = frameDocument.getElementById('hpmor-annotations-css');
    css.innerHTML = `
#storycontent {
    display: flex;
    flex-direction: row;
    margin-left: unset;
    margin-right: unset;
    max-width: none;
  }

#hpmor-annotations-wrapped-content {
    flex: 0 0 auto;
    max-width: 42em;
  }

  .hpmor-annotations-left-panel {
    flex: 1 1 300px;
  }

  .hpmor-annotations-right-panel {
    flex: 1 3 300px;
  }

  .hpmor-annotations-note {
    position: absolute;
    display: none;
    left: 0;
  }

  .hpmor-annotations-note-container {
    display: flex;
    height: 100%;
    margin-left: 5px;
    cursor: default;
    justify-content: flex-end;
  }

  .hpmor-annotations-note-tags {
    font: 600 15px "PT Sans", Georgia;
    font-variant: all-small-caps;
    border-radius: 5px 5px 0 0;
    padding: 0 7px;
  }

  .hpmor-annotations-note-text {
    border-radius: 0 0 5px 5px;
    background: #f0f0f0;
    border-width: 1px;
    font: 12px sans-serif;
    padding: 7px;
    flex-shrink: 0;
  }

  .hpmor-annotations-note-bracket {
    min-width: 3px;
    border-width: 2px;
    border-right-color: #fff0;
    margin: 0 5px;
  }

  .hpmor-annotations-link {
    text-decoration: none;
  }

  .hpmor-annotations-link:hover {
    text-decoration: underline;
  }

  .hpmor-annotations-span {
    text-decoration-line: dotted;
    text-decoration-style: underline;
    cursor: pointer;
  }
    `;
  }

  // Weight the left and right margins differently so we get a little more space
  // to put the annotations in.
  function wrapContent(frameDocument, content) {
    // Check if we've already wrapped content and return the inner div
    if (!frameDocument.getElementById('hpmor-annotations-wrapped-content')) {
      content.innerHTML = `
        <div class="hpmor-annotations-left-panel"></div>
        <div id="hpmor-annotations-wrapped-content">
          ${content.innerHTML}
        </div>
        <div class="hpmor-annotations-right-panel"></div>`;
    }

    return frameDocument.getElementById('hpmor-annotations-wrapped-content');
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

  function getNoteDiv(id) {
    return document.getElementById('hpmor-annotations-frame').contentDocument.getElementById(`${id}-note`);
  }

  function toggleNote(id, ev) {
    const note = getNoteDiv(id);

    // TODO: are these necessary?
    ev.preventDefault();
    ev.stopPropagation();

    if (activeNote) {
      if (activeNote !== note) {
        dismissNote();
      } else {
        dismissNote();
        return;
      }
    }

    activeNote = note;
    note.style.display = 'block';
    positionNote();
  }

  function positionNote() {
    if (!activeNote) { return; }

    const id = activeNote.id.match(/^(hpmor-[0-9]+-[0-9]+)-note$/)[1];
    const frame = document.getElementById('hpmor-annotations-frame');
    const content = frame.contentDocument.getElementById('hpmor-annotations-wrapped-content');
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
    activeNote.style.width = `${content.getBoundingClientRect().left + frame.contentWindow.pageXOffset}px`;
    activeNote.style.top = `${dimensions.top + frame.contentWindow.pageYOffset}px`;
    activeNote.style.height = `${dimensions.bottom - dimensions.top}px`;

    // TODO: use an overlay layout if not enough x space
  }

  function dismissNote() {
    activeNote.style.display = null;
    activeNote = null;
  }

  // Dev function for ease-of-use
  // TODO: remove this later
  function reloadScript() {
    const oldScript = document.getElementById('hpmor-annotations-script');

    if (!oldScript) {
      console.error('Could not find script to reload.');
    } else {
      // Clear any event listeners that we installed
      const frame = document.getElementById('hpmor-annotations-frame');
      frame.removeEventListener('load', handleFrameLoad);
      window.removeEventHandler('resize', positionNote);

      const newScript = document.createElement('script');
      newScript.src = oldScript.src.replace('dist', 'src');

      // Drop the old script element and add a new one
      oldScript.parentNode.removeChild(oldScript);
      document.body.appendChild(newScript);
    }
  }

  const exports = {installFrame, annotate, reloadScript};

  // Export everything for unit tests
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exports;
  } else {
    window.hpmorAnnotations = exports;
  }
})();

(function() {
  // This whole thing could probably be simplified by using more globals, but w/e
  // Used to track the currently displayed note
  let activeNote;

  // Used for development environment shortcuts
  const isLocal =
    window.location.hostname === '' &&
    window.location.pathname.match(/\/chapter\/[0-9]+\.html$/);

  const colors = {
    'foreshadowing': '#aaa',
    'consequence': '#f6f',
    'reference': '#77f',
    'departure': '#f90',
    'original': '#af0',
    'speculation': '#fbf',
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
      // maybe set innerHTML?
      frame.src = window.location.href;
      document.body.appendChild(frame);
    }

    const frame = document.getElementById('hpmor-annotations-frame');
    frame.style.width = '100vw';
    frame.style.height = '100vh';
    frame.style.border = 'none';

    frame.addEventListener('load', handleFrameLoad);

    // Reposition the active note if the window is resized
    window.addEventListener('resize', positionNotes);

    return frame;
  }

  function replaceJQueryClickEvents(jquery, element, fn) {
    jquery.data(element, 'events').click.forEach((data) => {
      jquery(element).unbind('click', data.handler);
    });

    jquery(element).bind('click', fn);
  }

  function installResizer(frameWindow, frameDocument) {
    const jquery = frameWindow.$;
    const smaller = frameDocument.getElementById('smaller').firstChild;
    const original = frameDocument.getElementById('original').firstChild;
    const bigger = frameDocument.getElementById('bigger').firstChild;

    // TODO: these all ignore cookies, can end up in a weird state with the
    // stuff that loads from cookies

    // Remove any state from the #storycontent element
    frameDocument.getElementById('storycontent').style = null;

    replaceJQueryClickEvents(jquery, smaller, () => {
      jquery('#storycontent').css('font-size', '-=1');
      jquery('.hpmor-annotations-note-tags').css('font-size', '-=1');
      jquery('.hpmor-annotations-note-text').css('font-size', '-=1');
      positionNotes();
    });

    replaceJQueryClickEvents(jquery, original, () => {
      jquery('#storycontent').css('font-size', '16px');
      jquery('.hpmor-annotations-note-tags').css('font-size', '15px');
      jquery('.hpmor-annotations-note-text').css('font-size', '12px');
      positionNotes();
    });

    replaceJQueryClickEvents(jquery, bigger, () => {
      jquery('#storycontent').css('font-size', '+=1');
      jquery('.hpmor-annotations-note-tags').css('font-size', '+=1');
      jquery('.hpmor-annotations-note-text').css('font-size', '+=1');
      positionNotes();
    });

    const fullwidth = frameDocument.getElementById('fullwidth').firstChild;
    const readwidth = frameDocument.getElementById('readwidth').firstChild;

    replaceJQueryClickEvents(jquery, fullwidth, () => {
      jquery('#hpmor-annotations-wrapped-content').css('max-width', '98%');
      jquery('#hpmor-annotations-left-panel').css('display', 'none');
      jquery('#hpmor-annotations-right-panel').css('display', 'none');
      positionNotes();
    });

    replaceJQueryClickEvents(jquery, readwidth, () => {
      jquery('#hpmor-annotations-wrapped-content').css('max-width', '42em');
      jquery('#hpmor-annotations-left-panel').css('display', 'block');
      jquery('#hpmor-annotations-right-panel').css('display', 'block');
      positionNotes();
    });

    // inverter should work like normal
    // TODO: it doesn't invert the span underlines
  }

  function installNotes(innerDocument, annotations) {
    const oldNotes = innerDocument.getElementById('hpmor-annotations-notes');

    if (oldNotes) {
      oldNotes.parentNode.removeChild(oldNotes);
    }

    const invertable = innerDocument.getElementById('invertable');
    const notes = innerDocument.createElement('div');
    notes.id = 'hpmor-annotations-notes';
    invertable.insertBefore(notes, invertable.childNodes[0]);

    // For each annotation, add a div which is hidden until the annotation is clicked
    Object.values(annotations).forEach((annotation) => {
      const color = colors[annotation.tags[0]];
      const note = document.createElement('div');
      note.id = `${annotation.id}-note`;
      note.className = 'hpmor-annotations-note';
      note.onclick = dismissNote;

      // TODO: include an icon linking to the source code for the annotation
      note.innerHTML = `
        <div class="hpmor-annotations-note-content">
          <div class="hpmor-annotations-note-tags" style="background: ${color}">${annotation.tags.join(' / ')}</div>
          <div class="hpmor-annotations-note-text" style="border-color: ${color}">${annotation.note}</div>
        </div>
        <div class="hpmor-annotations-note-bracket" style="border-color: ${color}"></div>
      `;

      notes.appendChild(note);
    });
  }

  function installRanges(innerDocument, annotations) {
    const oldRanges = innerDocument.getElementById('hpmor-annotations-ranges');
    
    if (oldRanges) {
      oldRanges.parentNode.removeChild(oldRanges);
    }

    const invertable = innerDocument.getElementById('invertable');
    const ranges = innerDocument.createElement('div');
    ranges.id = 'hpmor-annotations-ranges';
    invertable.insertBefore(ranges, invertable.childNodes[0]);

    Object.values(annotations).forEach((annotation) => {
      const color = colors[annotation.tags[0]];
      const range = document.createElement('div');
      range.id = `${annotation.id}-range`;
      range.className = 'hpmor-annotations-range-container';
      range.innerHTML = `
        <div class="hpmor-annotations-range-box">
          <div class="hpmor-annotations-range-divider"></div>
          <div class="hpmor-annotations-range" style="background: ${color}"></div>
        </div>
      `;

      // Allow clicking the range to toggle notes
      const rangeBox = range.getElementsByClassName('hpmor-annotations-range-box')[0];
      rangeBox.onclick = (ev) => toggleNote(annotation.id, ev);

      ranges.appendChild(range);
    });
  }

  function getTextSpans(content) {
    return Array.from(content.getElementsByClassName('hpmor-annotations-span'));
  }

  function installSpans(content, annotations) {
    getTextSpans(content).forEach((span) => {
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

    getTextSpans(content).forEach((span) => {
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
      console.error('hpmor-annotations: Could not find iframe');
    } else {
      const href = frame.contentWindow.location.href;
      const matches = href.match(/\/([0-9]+)(\.html)?(#.*)?$/);
      const chapter = matches && parseInt(matches[1]);
      const content = frame.contentDocument.getElementById('storycontent');

      if (!chapter) {
        console.error('hpmor-annotations: Could not determine chapter', href);
      } else if (!content) {
        console.error('hpmor-annotations: Could not find story content');
      } else {
        fetchAnnotations(frame, chapter, ({annotations, anchors}) => {
          installCss(frame.contentDocument);
          const innerContent = wrapContent(frame.contentDocument, content);
          installResizer(frame.contentWindow, frame.contentDocument);
          installSpans(innerContent, annotations);
          installNotes(frame.contentDocument, annotations);
          installRanges(frame.contentDocument, annotations);
          positionNotes();
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
    justify-content: center;
    margin-left: unset;
    margin-right: unset;
    max-width: none;
  }

  #hpmor-annotations-wrapped-content {
    flex: 0 0 auto;
    max-width: 42em;
  }

  #hpmor-annotations-left-panel {
    flex: 1 1 300px;
  }

  #hpmor-annotations-right-panel {
    flex: 1 3 300px;
  }

  .hpmor-annotations-note {
    position: absolute;
    left: 0;
    cursor: default;
    display: none;
    justify-content: flex-end;
  }

  .hpmor-annotations-note-content {
    flex: 1 0 auto;
    width: 75%;
    padding-left: 5px;
    display: flex;
    flex-direction: column;
    word-wrap: break-word;
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
  }

  .hpmor-annotations-note-bracket {
    min-width: 3px;
    border-style: solid;
    border-width: 2px;
    border-right-color: #fff0 !important;
    margin: 0 5px;
    flex: 0 0 auto;
  }

  .hpmor-annotations-range-container {
    position: absolute;
    height: 100%;
    align-items: center;
    justify-content: flex-end;
    pointer-events: none;
  }

  .hpmor-annotations-range-box {
    height: 100%;
    display: flex;
    flex-direction: column;
    margin-left: 5px;
    padding-left: 2px;
    padding-right: 2px;
    cursor: pointer;
    pointer-events: auto;
  }

  .hpmor-annotations-range-divider {
    flex: 0 0 1px;
    background: white;
  }

  .hpmor-annotations-range {
    flex: 1 0 auto;
    width: 3px;
  }

  .hpmor-annotations-link {
    text-decoration: none;
  }

  .hpmor-annotations-link:hover {
    text-decoration: underline;
  }

  .hpmor-annotations-span {
    text-decoration-style: dotted;
    text-decoration-line: underline;
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
        <div id="hpmor-annotations-left-panel"></div>
        <div id="hpmor-annotations-wrapped-content">
          ${content.innerHTML}
        </div>
        <div id="hpmor-annotations-right-panel"></div>`;
    }

    return frameDocument.getElementById('hpmor-annotations-wrapped-content');
  }

  function fetchAnnotations(frame, chapter, callback) {
    const oldScript = frame.contentDocument.getElementById('hpmor-annotations-data');
    if (oldScript) {
      oldScript.parentNode.removeChild(oldScript);
    }

    const newScript = frame.contentDocument.createElement('script');
    newScript.id = 'hpmor-annotations-data';

    if (isLocal) {
      newScript.src = `../dist/annotation/${chapter}.js`;
    } else {
      newScript.src = `https://tryneus.github.io/hpmor-annotations/dist/annotation/${chapter}.js`;
    }

    newScript.onload = () => {
      callback(frame.contentWindow.hpmorAnnotationsData);
    };

    frame.contentDocument.head.appendChild(newScript);
  }

  function getNoteDiv(id) {
    return document.getElementById('hpmor-annotations-frame').contentDocument.getElementById(`${id}-note`);
  }

  function toggleNote(id, ev) {
    const note = getNoteDiv(id);

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

    note.style.display = 'flex';
    activeNote = note;
  }

  function positionNotes() {
    // TODO: use an overlay layout if not enough x space
    const frame = document.getElementById('hpmor-annotations-frame');
    const content = frame.contentDocument.getElementById('hpmor-annotations-wrapped-content');
    const notes = Array.from(frame.contentDocument.getElementsByClassName('hpmor-annotations-note'));

    notes.forEach((note) => {
      const id = note.id.match(/^(hpmor-[0-9]+-[0-9]+)-note$/)[1];
      const range = frame.contentDocument.getElementById(`${id}-range`);
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

      if (dimensions.top && dimensions.bottom) {
        // Position the note so that it sits next to the annotated text
        note.style.width = `${content.getBoundingClientRect().left + frame.contentWindow.pageXOffset}px`;
        note.style.top = `${dimensions.top + frame.contentWindow.pageYOffset}px`;
        note.style.height = `${dimensions.bottom - dimensions.top}px`;

        range.style.left = `${content.getBoundingClientRect().right + frame.contentWindow.pageXOffset}px`;
        range.style.top = note.style.top;
        range.style.height = note.style.height;
      } else {
        // The spans could not be located, disable the associated range and note
        console.error('hpmor-annotations: Could not find span for annotation', id);
        note.style.display = 'none';
        range.style.display = 'none';
      }
    });
  }

  function dismissNote() {
    // This happens if someone clicks on the div of a hidden note
    if (!activeNote) { return; }

    activeNote.style.display = null;
    activeNote = null;
  }

  const exports = {installFrame, annotate};

  // Dev function for quicker debugging
  if (isLocal) {
    exports.reloadScript = () => {
      const oldScript = document.getElementById('hpmor-annotations-script');

      if (!oldScript) {
        console.error('Could not find script to reload.');
      } else {
        // Clear any event listeners that we installed
        const frame = document.getElementById('hpmor-annotations-frame');
        frame.removeEventListener('load', handleFrameLoad);
        window.removeEventListener('resize', positionNotes);

        const newScript = document.createElement('script');
        newScript.src = oldScript.src.replace('dist', 'src');
        newScript.id = 'hpmor-annotations-script';

        // Drop the old script element and add a new one
        oldScript.parentNode.removeChild(oldScript);
        document.head.appendChild(newScript);
      }
    };
  }

  // Export everything for unit tests
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exports;
  } else {
    window.hpmorAnnotations = exports;
  }
})();

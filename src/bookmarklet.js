javascript:(function () {
  // Not really sure what I'm doing here, but the general idea is to reload the
  // page in an iframe, then apply the annotations to the iframe any time a new
  // chapter is loaded.
  // TODO: do we need to do some cleanup if the user navigates away from hpmor?
  while (document.body.children.length > 0) {
    document.body.removeChild(document.body.children[0]);
  }

  const frame = document.createElement('iframe');
  frame.src = window.location.href;
  frame.style.width = '100vw';
  frame.style.height = '100vh';
  frame.style.border = 'none';

  const frameLoadListener = frame.addEventListener('load', () => {
    // Rewrite links to open in this frame
    Array.from(frame.contentDocument.getElementsByTagName('a')).map((x) => {
      if (x.target === '_top') {
        x.target = '_self';
      }
    });

    // Update the window title/url and get the chapter number for annotations
    const href = frame.contentWindow.location.href;
    window.history.replaceState({}, '', href);
    document.title = frame.contentDocument.title;

    const matches = href.match(/\/([0-9]+)$/)[0];
    const chapter = matches && parseInt(matches[1]);
    console.log('chapter', chapter);

    // TODO: load the json object for annotations, apply them
  });

  const windowLoadListener = window.addEventListener('load', () => console.log('window load'));

  document.body.appendChild(frame);
})();

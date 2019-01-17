javascript:(function () {
  // Reload the page in an iframe, change links so that they only navigate the
  // iframe instead of the top-level window, then apply the annotations to the
  // iframe story contents any time a new page is loaded.
  // TODO: do we need to do some cleanup if the user navigates away from hpmor?

  // Only do the thing if we're viewing an official HPMoR chapter
  const is_local =
    window.location.hostname === '' &&
    window.location.pathname.match(/\/chapter\/[0-9]+\.html$/);
  const is_remote =
    window.location.hostname === 'www.hpmor.com' &&
    window.location.pathname.match(/\/chapter\/[0-9]+$/);

  if (!is_local && !is_remote) {
    console.error('hpmor-annotations: Unrecognized site, aborting.');
    return;
  }

  while (document.body.children.length > 0) {
    document.body.removeChild(document.body.children[0]);
  }

  const frame = document.createElement('iframe');
  frame.src = window.location.href;
  frame.style.width = '100vw';
  frame.style.height = '100vh';
  frame.style.border = 'none';

  // Load the script that applies annotations
  const script = document.createElement('script');
  script.src = is_local ? '../dist/annotate.js' : 'https://tryneus.github.io/hpmor-annotations/dist/annotate.js';

  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.left = '0';
  overlay.style.top = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.border = 'none';
  overlay.style['pointer-events'] = 'none';

  const frameLoadListener = frame.addEventListener('load', () => {
    // Rewrite links to open in this frame
    Array.from(frame.contentDocument.getElementsByTagName('a')).map((x) => {
      if (x.target === '_top') {
        x.target = '_self';
      }
    });

    // The chapter select drop-down navigates from the top as well
    frame.contentDocument.getElementById('nav-form-top').target = '_self';

    // Update the window title/url and get the chapter number for annotations
    const href = frame.contentWindow.location.href;
    window.history.replaceState({}, '', href);
    document.title = frame.contentDocument.title;

    const matches = href.match(/\/([0-9]+)$/);
    const chapter = matches && parseInt(matches[1]);

    const content = frame.contentDocument.getElementById('storycontent');
    if (!content) {
      console.error('hpmor-annotations: Could not find story content.');
    } else if (annotate) {
      annotate(frame, overlay, chapter);
    } else {
      script.onload = () => annotate(frame, overlay, chapter);
    }
  });

  document.body.appendChild(frame);
  document.body.appendChild(overlay);
  document.body.appendChild(script);
})();

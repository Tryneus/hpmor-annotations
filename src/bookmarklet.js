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

  if (document.getElementById('hpmor-annotations-frame') || document.getElementById('hpmor-annotations-overlay')) {
    console.error('hpmor-annotations: Bookmarklet already applied, aborting.');
    return;
  }

  while (document.body.children.length > 0) {
    document.body.removeChild(document.body.children[0]);
  }

  const frame = document.createElement('iframe');
  frame.id = 'hpmor-annotations-frame';
  frame.src = window.location.href;
  frame.style.width = '100vw';
  frame.style.height = '100vh';
  frame.style.border = 'none';

  // Load the script that applies annotations
  const script = document.createElement('script');
  script.src = is_local ? '../dist/annotate.js' : 'https://tryneus.github.io/hpmor-annotations/dist/annotate.js';

  const overlay = document.createElement('div');
  overlay.id = 'hpmor-annotations-overlay';
  overlay.style = {
    position: 'absolute',
    left: '0',
    top: '0',
    width: '100vw',
    height: '100vh',
    border: 'none',
    'pointer-events': 'none',
  };

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
    window.history.replaceState({}, '', frame.contentWindow.location.href);
    document.title = frame.contentDocument.title;

    if (annotate) {
      annotate();
    } else {
      script.onload = () => annotate();
    }
  });

  document.body.appendChild(frame);
  document.body.appendChild(overlay);
  document.body.appendChild(script);
})();

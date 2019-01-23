javascript:(function () {
  // Only do the thing if we're viewing an official HPMoR chapter
  const isLocal =
    window.location.hostname === '' &&
    window.location.pathname.match(/\/chapter\/[0-9]+\.html$/);
  const isRemote =
    window.location.hostname === 'www.hpmor.com' &&
    window.location.pathname.match(/\/chapter\/[0-9]+$/);

  if (!is_local && !is_remote) {
    console.error('hpmor-annotations: Unrecognized site, aborting.');
  } else if (window.hpmorAnnotations) {
    window.hpmorAnnotations.annotate();
  } else {
    const script = document.createElement('script');
    script.id = 'hpmor-annotations-script';
    script.src = is_local ? '../dist/annotate.js' : 'https://tryneus.github.io/hpmor-annotations/dist/annotate.js';
    script.onload = () => window.hpmorAnnotations.installFrame();
    document.head.appendChild(script);
  }
})();

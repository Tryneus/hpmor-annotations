function annotate(frame, overlay, chapter) {
  console.log('annotate', frame, overlay, chapter);
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
    newScript.src = oldScript.src;

    oldScript.parentNode.removeChild(oldScript);
    document.body.appendChild(newScript);
  }
}

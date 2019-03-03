(() => {
  const data = {"annotations":{},"anchors":{"hpmor-12-19-1":{"id":"hpmor-12-19-1","annotationId":"hpmor-12-19","text":"Baba Yaga","annotationChapter":"12","disambiguation":{"expect":1,"useIndex":0}},"hpmor-16-11-1":{"id":"hpmor-16-11-1","annotationId":"hpmor-16-11","text":"I wore the mountain troll as a false tooth","annotationChapter":"16","disambiguation":{"expect":1,"useIndex":0}}}};
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = data;
  } else {
    window.hpmorAnnotationsData = data;
  }
})();
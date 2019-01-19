function annotate(){let n=document.getElementById('hpmor-annotations-frame'),t=document.getElementById('hpmor-annotations-overlay');if(!n)console.error('hpmor-annotations: Could not find iframe.');else{let e=n.contentWindow.location.href,o=e.match(/\/([0-9]+)(\.html)?$/),r=o&&parseInt(o[1]),a=n.contentDocument.getElementById('storycontent');t?r?a?fetchAnnotations(r,n=>{innerHTML=a.innerHTML.replace(/[\n ]+/g,' '),Object.values(n).forEach(n=>{innerHTML=innerHTML.replace(n.text,n.replacement)}),a.innerHTML=innerHTML,clearNotes(a),addNotes(a,n)}):console.error('hpmor-annotations: Could not find story content.'):console.error('hpmor-annotations: Could not determine chapter.',e):console.error('hpmor-annotations: Could not find overlay.')}}function getAnnotationSpans(n){return Array.from(n.getElementsByTagName('span')).filter(n=>n.attributes.annotation&&n.attributes.annotation.value.match(/^hpmor-[0-9]+-[0-9]+$/))}function fetchAnnotations(n,t){let e=new XMLHttpRequest;e.open('GET',`https://tryneus.github.io/hpmor-annotations/dist/annotation/${n}.json`);e.send();e.onerror=()=>{console.error('hpmor-annotations: Could not load annotations.')};e.onload=()=>{e.status!==200?console.error('hpmor-annotations: Loading annotations failed, status:',e.status):t(parseAnnotations(e.response))}}function parseAnnotations(n){try{return JSON.parse(n)}catch(n){console.error('hpmor-annotations: Failed to parse annotations',n)}}function clearNotes(n){getAnnotationSpans(n).forEach(n=>{n.outerHTML=n.innerHTML})}function addNotes(n,t){let e={'foreshadowing':'#888','consequence':'#f6f','reference':'#66f','departure':'#f90','original':'#6f0','speculation':'#e0f','background':'#30f','spoiler':'#f00'};getAnnotationSpans(n).forEach(n=>{let o=n.attributes.annotation.value,r=t[o];if(!r){console.error('hpmor-annotations: Could not find annotation',o);return}let a=e[r.tags[0]];n.style['text-decoration']=`dotted ${a} underline`})}function reloadScript(){let n=Array.from(document.getElementsByTagName('script')).filter(n=>Boolean(n.src.match(/\/annotate.js$/)));if(n.length===0)console.error('Could not find script to reload.');else if(n.length>1)console.error('Found too many matching script elements.',n);else{let t=n[0],e=document.createElement('script');e.src=t.src.replace('dist','src');t.parentNode.removeChild(t);document.body.appendChild(e)}}typeof module!=='undefined'&&module.exports&&(module.exports={annotate,fetchAnnotations,parseAnnotations,addNotes,reloadScript})
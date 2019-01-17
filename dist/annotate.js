function annotate(){let t=document.getElementById('hpmor-annotations-frame'),n=document.getElementById('hpmor-annotations-overlay');if(!t)console.error('hpmor-annotations: Could not find iframe.');else{let e=t.contentWindow.location.href,o=e.match(/\/([0-9]+)(\.html)?$/),r=o&&parseInt(o[1]),a=t.contentDocument.getElementById('storycontent');n?r?a?fetch_annotations(r,t=>apply_annotations(a,n,t)):console.error('hpmor-annotations: Could not find story content.'):console.error('hpmor-annotations: Could not determine chapter.',e):console.error('hpmor-annotations: Could not find overlay.')}}function fetch_annotations(t,n){let e=new XMLHttpRequest;e.open('GET',`https://tryneus.github.io/hpmor-annotations/dist/annotation/${t}.json`);e.send();e.onerror=()=>{console.error('hpmor-annotations: Could not load annotations.')};e.onload=()=>{e.status!==200?console.error('hpmor-annotations: Loading annotations failed, status:',e.status):n(parse_annotations(e.response))}}function parse_annotations(t){try{return JSON.parse(t)}catch(t){console.error('hpmor-annotations: Failed to parse annotations',t)}}function apply_annotations(t,n,e){let o=Array.from(t.getElementsByTagName('p'));e.map((t,n)=>{let e=t.text.map((n,e)=>{if(e===0||e===t.text.length-1){return o.filter(t=>t.innerText.includes(n))}else{return o.filter(t=>t.innerText===n)}});console.log(`annotation ${n}:`,e.map((n,e)=>[t.text[e],n]))})}function reload_script(){let t=Array.from(document.getElementsByTagName('script')).filter(t=>Boolean(t.src.match(/\/annotate.js$/)));if(t.length===0)console.error('Could not find script to reload.');else if(t.length>1)console.error('Found too many matching script elements.',t);else{let n=t[0],e=document.createElement('script');e.src=n.src.replace('dist','src');n.parentNode.removeChild(n);document.body.appendChild(e)}}
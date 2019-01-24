!function(){let t,e=window.location.hostname===''&&window.location.pathname.match(/\/chapter\/[0-9]+\.html$/),n={'foreshadowing':'#aaa','consequence':'#f6f','reference':'#77f','departure':'#f90','original':'#af0','speculation':'#e0f','background':'#30f','spoiler':'#f00'};function o(){let e=document.getElementById('hpmor-annotations-frame'),n=e.contentDocument;Array.from(n.getElementsByTagName('a')).map(t=>{t.target==='_top'&&(t.target='_self')});n.getElementById('nav-form-top').target='_self';window.history.replaceState({},'',e.contentWindow.location.href);document.title=n.title;t=null;c()}function a(){if(!document.getElementById('hpmor-annotations-frame')){while(document.body.children.length>0)document.body.removeChild(document.body.children[0]);let t=document.createElement('iframe');t.id='hpmor-annotations-frame';t.src=window.location.href;document.body.appendChild(t)}let t=document.getElementById('hpmor-annotations-frame');t.style.width='100vw';t.style.height='100vh';t.style.border='none';t.addEventListener('load',o);window.addEventListener('resize',u);return t}function r(t,e){let o=t.getElementById('hpmor-annotations-notes');o&&o.parentNode.removeChild(o);let a=t.createElement('div');a.id='hpmor-annotations-notes';t.body.insertBefore(a,t.body.childNodes[0]);Object.values(e).forEach(t=>{let e=n[t.tags[0]],o=document.createElement('div');o.id=`${t.id}-note`;o.className='hpmor-annotations-note';o.onclick=g;o.innerHTML=`
        <div class="hpmor-annotations-note-container">
          <div class="hpmor-annotations-note-content">
            <div class="hpmor-annotations-note-tags" style="background: ${e}">${t.tags.join(' / ')}</div>
            <div class="hpmor-annotations-note-text" style="border-color: ${e}">${t.note}</div>
          </div>
          <div class="hpmor-annotations-note-bracket" style="border-color: ${e}"></div>
        </div>
      `;a.appendChild(o)})}function i(t,e){let o=t.getElementById('hpmor-annotations-dashes');o&&o.parentNode.removeChild(o);let a=t.createElement('div');a.id='hpmor-annotations-dashes';t.body.insertBefore(a,t.body.childNodes[0]);Object.values(e).forEach(t=>{let e=n[t.tags[0]],o=document.createElement('div');o.id=`${t.id}-dash`;o.className='hpmor-annotations-dash-container';o.innerHTML=`
        <div class="hpmor-annotations-dash-box">
          <div class="hpmor-annotations-dash" style="background: ${e}"></div>
        </div>
      `;let r=o.getElementsByClassName('hpmor-annotations-dash-box')[0];r.onclick=e=>f(t.id,e);a.appendChild(o)})}function m(t){return Array.from(t.getElementsByClassName('hpmor-annotations-span'))}function s(t,e){m(t).forEach(t=>{t.outerHTML=t.innerHTML});let o=t.innerHTML.replace(/[\n ]+/g,' ');Object.values(e).forEach(t=>{o=o.replace(t.text,t.replacement)});t.innerHTML=o;m(t).forEach(t=>{let o=t.attributes.annotation.value,a=e[o];if(!a){console.error('hpmor-annotations: Could not find annotation',o);return null}let r=n[a.tags[0]];t.style['text-decoration-color']=r;t.onclick=t=>f(o,t)})}function c(){let t=a();if(!t)console.error('hpmor-annotations: Could not find iframe.');else{let e=t.contentWindow.location.href,n=e.match(/\/([0-9]+)(\.html)?$/),o=n&&parseInt(n[1]),a=t.contentDocument.getElementById('storycontent');o?a?p(t,o,({annotations:e,anchors:n})=>{l(t.contentDocument);let o=d(t.contentDocument,a);s(o,e);r(t.contentDocument,e);i(t.contentDocument,e);u()}):console.error('hpmor-annotations: Could not find story content.'):console.error('hpmor-annotations: Could not determine chapter.',e)}}function l(t){if(!t.getElementById('hpmor-annotations-css')){let e=t.createElement('style');e.id='hpmor-annotations-css';e.type='text/css';t.head.appendChild(e)}let e=t.getElementById('hpmor-annotations-css');e.innerHTML="\n  #storycontent {\n    display: flex;\n    flex-direction: row;\n    margin-left: unset;\n    margin-right: unset;\n    max-width: none;\n  }\n\n  #hpmor-annotations-wrapped-content {\n    flex: 0 0 auto;\n    max-width: 42em;\n  }\n\n  .hpmor-annotations-left-panel {\n    flex: 1 1 300px;\n  }\n\n  .hpmor-annotations-right-panel {\n    flex: 1 3 300px;\n  }\n\n  .hpmor-annotations-note {\n    position: absolute;\n    left: 0;\n    cursor: default;\n  }\n\n  .hpmor-annotations-note-container {\n    display: none;\n    height: inherit;\n    justify-content: flex-end;\n  }\n\n  .hpmor-annotations-note-content {\n    flex: 1 0 auto;\n    width: 75%;\n    padding-left: 5px;\n    display: flex;\n    flex-direction: column;\n  }\n\n  .hpmor-annotations-note-tags {\n    font: 600 15px \"PT Sans\", Georgia;\n    font-variant: all-small-caps;\n    border-radius: 5px 5px 0 0;\n    padding: 0 7px;\n  }\n\n  .hpmor-annotations-note-text {\n    border-radius: 0 0 5px 5px;\n    background: #f0f0f0;\n    border-width: 1px;\n    font: 12px sans-serif;\n    padding: 7px;\n    word-wrap: break-word;\n  }\n\n  .hpmor-annotations-note-bracket {\n    min-width: 3px;\n    border-style: solid;\n    border-width: 2px;\n    border-right-color: #fff0 !important;\n    margin: 0 5px;\n    flex: 0 0 auto;\n  }\n\n  .hpmor-annotations-dash-container {\n    position: absolute;\n    display: flex;\n    height: 100%;\n    align-items: center;\n    justify-content: flex-end;\n    pointer-events: none;\n  }\n\n  .hpmor-annotations-dash-box {\n    height: 10px;\n    width: 10px;\n    margin-right: 5px;\n    cursor: pointer;\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    justify-content: center;\n    pointer-events: auto;\n  }\n\n  .hpmor-annotations-dash {\n    width: 8px;\n    height: 2px;\n  }\n\n  .hpmor-annotations-link {\n    text-decoration: none;\n  }\n\n  .hpmor-annotations-link:hover {\n    text-decoration: underline;\n  }\n\n  .hpmor-annotations-span {\n    text-decoration-style: dotted;\n    text-decoration-line: underline;\n    cursor: pointer;\n  }\n    "}function d(t,e){t.getElementById('hpmor-annotations-wrapped-content')||(e.innerHTML=`
        <div class="hpmor-annotations-left-panel"></div>
        <div id="hpmor-annotations-wrapped-content">
          ${e.innerHTML}
        </div>
        <div class="hpmor-annotations-right-panel"></div>`);return t.getElementById('hpmor-annotations-wrapped-content')}function p(t,n,o){let a=t.contentDocument.getElementById('hpmor-annotations-data');a&&a.parentNode.removeChild(a);let r=t.contentDocument.createElement('script');r.id='hpmor-annotations-data';e?(r.src=`../dist/annotation/${n}.js`):(r.src=`https://tryneus.github.io/hpmor-annotations/dist/annotation/${n}.js`);r.onload=()=>{o(t.contentWindow.hpmorAnnotationsData)};t.contentDocument.head.appendChild(r)}function h(t){return document.getElementById('hpmor-annotations-frame').contentDocument.getElementById(`${t}-note`)}function f(e,n){let o=h(e);n.preventDefault();n.stopPropagation();if(t){if(t!==o)g();else{g();return}}o.style.display='flex';t=o}function u(){let t=document.getElementById('hpmor-annotations-frame'),e=t.contentDocument.getElementById('hpmor-annotations-wrapped-content'),n=Array.from(t.contentDocument.getElementsByClassName('hpmor-annotations-note'));n.forEach(n=>{let o=n.id.match(/^(hpmor-[0-9]+-[0-9]+)-note$/)[1],a=t.contentDocument.getElementById(`${o}-dash`),r=Array.from(t.contentDocument.getElementsByTagName('span')).filter(t=>t.attributes.annotation&&t.attributes.annotation.value===o),i=r.reduce((t,e)=>{let{top:n,bottom:o}=e.getBoundingClientRect();return{top:t&&(t.top<n?t.top:n)||n,bottom:t&&(t.bottom>o?t.bottom:o)||o}},{});n.style.width=`${e.getBoundingClientRect().left+t.contentWindow.pageXOffset}px`;n.style.top=`${i.top+t.contentWindow.pageYOffset}px`;n.style.height=`${i.bottom-i.top}px`;a.style.left=`${e.getBoundingClientRect().right+t.contentWindow.pageXOffset}px`;a.style.top=n.style.top;a.style.height=n.style.height})}function g(){if(!t){return}t.style.display=null;t=null}let y={installFrame:a,annotate:c};e&&(y.reloadScript=()=>{let t=document.getElementById('hpmor-annotations-script');if(!t)console.error('Could not find script to reload.');else{let e=document.getElementById('hpmor-annotations-frame');e.removeEventListener('load',o);window.removeEventListener('resize',u);let n=document.createElement('script');n.src=t.src.replace('dist','src');n.id='hpmor-annotations-script';t.parentNode.removeChild(t);document.head.appendChild(n)}});typeof module!=='undefined'&&module.exports?(module.exports=y):(window.hpmorAnnotations=y)}()
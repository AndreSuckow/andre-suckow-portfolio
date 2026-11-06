var e=`andre:prefs`;function t(){try{return JSON.parse(localStorage.getItem(e)||`{}`)}catch{return{}}}function n(n){let r={...t(),...n};try{localStorage.setItem(e,JSON.stringify(r))}catch{}return r}var r=(e,t=document)=>t.querySelector(e),i=0;function a(e){let t=r(`#announcer`);t&&(window.clearTimeout(i),t.textContent=``,i=window.setTimeout(()=>t.textContent=e,60))}var o=0;function s(e,t=2600){let n=r(`[data-hud-toast]`);n&&(n.textContent=e,n.hidden=!1,window.clearTimeout(o),o=window.setTimeout(()=>n.hidden=!0,t))}var loadingEpoch=0;
function showSiteLoading(){loadingEpoch++;const root=document.documentElement,loader=r('[data-loader]');root.dataset.siteLoading='true';if(loader)loader.hidden=false;r('[data-loader-fallback]')?.removeAttribute('disabled');r('main')?.setAttribute('aria-busy','true');document.dispatchEvent(new CustomEvent('portfolio:loading-start'));}
function loadingProgress(value,label,complete=false){const percent=complete?100:Math.round(Math.min(1,Math.max(0,value))*99),fill=r('[data-loader-fill]'),number=r('[data-loader-pct]'),bar=r('[data-loader] [role="progressbar"]');if(fill)fill.style.width=percent+'%';if(number)number.textContent=percent+'%';bar?.setAttribute('aria-valuenow',String(percent));if(label){const text=r('[data-loader-label]');if(text)text.textContent=label;}}
async function hideSiteLoading(){
 const epoch=++loadingEpoch;
 try{if(document.fonts?.ready)await document.fonts.ready;}catch{}
 const frame=()=>new Promise(resolve=>window.requestAnimationFrame?window.requestAnimationFrame(resolve):setTimeout(resolve,0));
 await frame();await frame();if(epoch!==loadingEpoch)return;
 const root=document.documentElement,loader=r('[data-loader]'),restoreFocus=loader?.contains(document.activeElement);
 r('[data-loader-fallback]')?.setAttribute('disabled','');
 loadingProgress(1,undefined,true);document.dispatchEvent(new CustomEvent('portfolio:loading-ready'));
 const finish=()=>{
  if(epoch!==loadingEpoch)return false;
  if(loader)loader.hidden=true;delete root.dataset.siteLoading;r('main')?.removeAttribute('aria-busy');
  if(restoreFocus){const main=r('main');main?.setAttribute('tabindex','-1');main?.focus({preventScroll:true});}
  return true;
 };
 if(!loader||loader.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return finish();
 const styles=getComputedStyle(loader),fadeOut=parseFloat(styles.getPropertyValue('--loading-card-fade'))||400,fadeIn=parseFloat(styles.getPropertyValue('--loading-reveal-fade'))||850;
 root.dataset.siteLoading='leaving';
 return new Promise(resolve=>setTimeout(()=>{
  if(epoch!==loadingEpoch){resolve(false);return;}
  root.dataset.siteLoading='revealing';setTimeout(()=>resolve(finish()),fadeIn);
 },fadeOut));
}
var c={show:showSiteLoading,progress:loadingProgress,hide:hideSiteLoading};function l(e,t=0,n=0){let i=r(`[data-hud-tooltip]`);i&&(e?(i.textContent=e,i.style.setProperty(`--x`,`${t}px`),i.style.setProperty(`--y`,`${n}px`),i.hidden=!1):i.hidden=!0)}var u=(function(){let e=typeof document<`u`&&document.createElement(`link`).relList;return e&&e.supports&&e.supports(`modulepreload`)?`modulepreload`:`preload`})(),d=function(e){return`/`+e},f={},p=function(e){return e.pathname.endsWith(`.css`)},m=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw e[t]=void 0,n});return e[t]=i,i},h=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=d(t,n);let r=s(t),i=p(r);return m(f,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let t=document.createElement(`link`);if(t.rel=i?`stylesheet`:u,i||(t.as=`script`),t.crossOrigin=``,t.href=r.href,a&&t.setAttribute(`nonce`,a),document.head.appendChild(t),i)return new Promise((e,n)=>{t.addEventListener(`load`,e),t.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${r}`)))})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},g=document.documentElement,_=matchMedia(`(prefers-reduced-motion: reduce)`),v=null,y=null,requestedMode=document.documentElement.dataset.loadingFallback?`2d`:`3d`;function b(){try{let e=document.createElement(`canvas`).getContext(`webgl2`,{failIfMajorPerformanceCaveat:!0}),t=!!e;return e?.getExtension(`WEBGL_lose_context`)?.loseContext(),t}catch{return!1}}function x(){let e=window.innerHeight*.4;return Array.from(document.querySelectorAll(`main > section, .game > section`)).find(t=>{let n=t.getBoundingClientRect();return n.top<=e&&n.bottom>e})??null}function S(e){let t=window.scrollY>40?x():null;g.dataset.mode=e,t&&t.scrollIntoView({block:`start`,behavior:`instant`}),v?.setActive(e===`3d`),a(e===`3d`?`Versão 3D ativada`:`Versão 2D ativada`)}function C(){return y||(c.show(),c.progress(0),y=h(async()=>{let{start:e}=await import(`./engine.js?v=01c7965121e8`);return{start:e}},[]).then(({start:e})=>e({canvas:r(`#stage-canvas`),reducedMotion:_.matches,prefs:t(),onProgress:e=>c.progress(e)})).then(async e=>{v=e;const revealed=await c.hide();if(revealed&&requestedMode===`3d`)S(`3d`);return e;}).catch(e=>(console.error(`[vf16] 3D indisponível, usando a versão 2D.`,e),c.hide(),y=null,requestedMode=`2d`,S(`2d`),null)),y)}function w(e){let t=r(`[data-toggle="mode"]`);t&&e&&(t.hidden=!1,t.addEventListener(`click`,async()=>{if(t.disabled)return;let e=g.dataset.mode===`3d`?`2d`:`3d`;t.disabled=!0;t.setAttribute(`aria-busy`,`true`);try{requestedMode=e;e===`3d`?await C()&&S(`3d`):S(`2d`)}finally{t.disabled=!1;t.removeAttribute(`aria-busy`)}}))}function T(){let e=Array.from(document.querySelectorAll(`[data-nav-tab]`));if(!e.length||!(`IntersectionObserver`in window))return;let t=new IntersectionObserver(t=>{for(let n of t){if(!n.isIntersecting)continue;let t=n.target.id;for(let n of e)n.setAttribute(`aria-current`,String(n.dataset.navTab===t))}},{rootMargin:`-45% 0px -50% 0px`});document.querySelectorAll(`.game > section`).forEach(e=>t.observe(e))}function E(){}document.addEventListener(`portfolio:loading-fallback`,()=>{requestedMode=`2d`;S(`2d`);c.hide()});function D(){let n=b();if(g.dataset.webgl=String(n),w(n),T(),E(),!n||requestedMode===`2d`){S(`2d`);c.hide();return}let r=()=>{if(requestedMode===`3d`)C()};document.readyState===`complete`?O(r):window.addEventListener(`load`,()=>O(r),{once:!0})}function O(e){`requestIdleCallback`in window?window.requestIdleCallback(e,{timeout:1200}):setTimeout(e,200)}
// Keep the fading HTML opening from intercepting interactions with the 3D scene.
function guardHeroInteractions(){
 const root=document.documentElement,hero=document.querySelector('.hero');
 if(!hero)return;
 const sync=()=>{
  const fading=root.dataset.mode==='3d'&&(parseFloat(root.style.getPropertyValue('--intro-fade'))||0)>0;
  if(hero.hasAttribute('inert')===fading)return;
  const heldFocus=hero.contains(document.activeElement);
  hero.toggleAttribute('inert',fading);
  if(fading&&heldFocus)document.getElementById('stage-canvas')?.focus({preventScroll:true});
 };
 new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-mode','style']});
 sync();
}
guardHeroInteractions();
D();export{n as a,l as i,a as n,s as r,r as t};

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const html=fs.readFileSync('public/index.html','utf8');
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
async function until(check){for(let i=0;i<100;i++){if(check())return;await tick();}assert.fail('Loading screen did not finish');}
function setup({webgl=true,reducedMotion=true,controlTransitions=false}={}){
 const dom=new JSDOM(html,{url:'http://localhost:4173/',runScripts:'outside-only'}),w=dom.window,d=w.document;
 d.querySelectorAll('noscript').forEach(node=>node.remove());
 w.matchMedia=()=>({matches:reducedMotion});w.requestIdleCallback=callback=>callback();w.console.error=()=>{};
 Object.defineProperty(d,'readyState',{value:'complete'});
 w.HTMLCanvasElement.prototype.getContext=()=>webgl?{getExtension:()=>({loseContext(){}})}:null;
 let slow,resolveEngine,rejectEngine,resolveFonts,progress;const active=[];
 const transitions=[];
 const timeout=w.setTimeout.bind(w);w.setTimeout=(callback,delay,...args)=>{if(delay===10000){slow=callback;return 9999;}if(controlTransitions&&[400,850].includes(delay)){transitions.push({callback,delay});return 9998;}return timeout(callback,delay,...args);};
 Object.defineProperty(d,'fonts',{value:{ready:new Promise(resolve=>{resolveFonts=resolve;})}});
 const enginePromise=new Promise((resolve,reject)=>{resolveEngine=()=>resolve({setActive:value=>active.push(value)});rejectEngine=reject;});
 // The unsupported-WebGL branch never consumes the deferred engine.
 enginePromise.catch(()=>{});
 w.__engineStart=options=>{progress=options.onProgress;return enginePromise;};
 w.eval(d.querySelector('[data-loading-guard]').textContent);
 const source=fs.readFileSync('src/boot.js','utf8').replace(/import\(`\.\/engine\.js\?v=cs-mode-3`\)/,'Promise.resolve({start:window.__engineStart})').replaceAll('import.meta','({url:location.href})').replace(/export\{[^}]+\};?\s*$/,'');
 w.eval(source);
 return {dom,w,d,active,finish:resolveEngine,fail:rejectEngine,fonts:resolveFonts,slow:()=>slow(),progress:value=>progress(value),transitions,advance:()=>transitions.shift()?.callback()};
}

test('initial screen is present before boot; the site waits for the engine, fonts and first frames',async()=>{
 const s=setup();await tick();const loader=s.d.querySelector('[data-loader]');
 assert(!loader.hidden);assert.equal(s.d.documentElement.dataset.siteLoading,'true');
 assert.equal(s.d.querySelector('main').getAttribute('aria-busy'),'true');
 assert.deepEqual(s.active,[],'Continuous 3D rendering waits until the entrance is complete');
 s.progress(1);assert.equal(s.d.querySelector('[data-loader-pct]').textContent,'99%');
 s.finish();await tick();assert.equal(s.d.documentElement.dataset.siteLoading,'true','Fonts still pending');
 s.slow();s.d.querySelector('[data-loader-fallback]').focus();assert.equal(s.d.activeElement,s.d.querySelector('[data-loader-fallback]'));
 s.fonts();await until(()=>loader.hidden);
 assert(!s.d.documentElement.hasAttribute('data-site-loading'));
 assert.equal(s.d.querySelector('[role=progressbar]').getAttribute('aria-valuenow'),'100');
 assert(!s.d.querySelector('main').hasAttribute('aria-busy'));assert.equal(s.d.activeElement,s.d.querySelector('main'));s.dom.window.close();
});

test('WebGL unavailability and initialization errors reveal the readable 2D version',async()=>{
 for(const webgl of [false,true]){const s=setup({webgl});await tick();if(webgl)s.fail(Error('GPU initialization failed'));s.fonts();await until(()=>s.d.querySelector('[data-loader]').hidden);assert.equal(s.d.documentElement.dataset.mode,'2d');assert(!s.d.documentElement.hasAttribute('data-site-loading'));s.dom.window.close();}
});

test('slow loading offers 2D and a late engine cannot override that choice',async()=>{
 const s=setup();await tick();const button=s.d.querySelector('[data-loader-fallback]');assert(button.hidden);
 s.slow();assert(!button.hidden);button.click();assert.equal(s.d.documentElement.dataset.mode,'2d');assert(s.d.querySelector('[data-loader]').hidden);
 s.finish();s.fonts();await until(()=>!s.d.documentElement.hasAttribute('data-site-loading'));
 assert.equal(s.d.documentElement.dataset.mode,'2d');assert(!s.active.includes(true));s.dom.window.close();
});

test('100 percent fades the card before revealing the portfolio, retaining busy state until the reveal ends',async()=>{
 const s=setup({reducedMotion:false,controlTransitions:true}),root=s.d.documentElement,loader=s.d.querySelector('[data-loader]');
 await tick();s.finish();s.fonts();await until(()=>root.dataset.siteLoading==='leaving');
 assert.equal(s.d.querySelector('[data-loader-pct]').textContent,'100%');assert(!loader.hidden);
 assert.equal(s.d.querySelector('main').getAttribute('aria-busy'),'true');
 assert.equal(s.w.getComputedStyle(s.d.querySelector('main')).visibility,'hidden');
 assert.equal(s.transitions[0].delay,400);s.advance();
 assert.equal(root.dataset.siteLoading,'revealing');assert(!loader.hidden);
 assert.deepEqual(s.active,[]);
 assert.equal(s.w.getComputedStyle(s.d.querySelector('main')).visibility,'visible');
 assert.equal(s.w.getComputedStyle(s.d.querySelector('.site-loading__card')).opacity,'0');
 assert.equal(s.transitions[0].delay,850);s.advance();
 assert(loader.hidden);assert(!root.hasAttribute('data-site-loading'));assert(!s.d.querySelector('main').hasAttribute('aria-busy'));await tick();assert(s.active.includes(true));s.dom.window.close();
});

test('a manual 2D fallback never hides the page again or waits for decorative fades',async()=>{
 const s=setup({reducedMotion:false,controlTransitions:true});await tick();s.slow();s.d.querySelector('[data-loader-fallback]').click();
 let ready=false;s.d.addEventListener('portfolio:loading-ready',()=>{ready=true;});s.finish();s.fonts();await until(()=>ready);
 assert.equal(s.transitions.length,0);assert(s.d.querySelector('[data-loader]').hidden);assert(!s.d.documentElement.hasAttribute('data-site-loading'));assert.equal(s.d.documentElement.dataset.mode,'2d');s.dom.window.close();
});

test('a fresh loading cycle cancels an earlier fade completion',async()=>{
 const s=setup({reducedMotion:false,controlTransitions:true});await tick();s.finish();s.fonts();await until(()=>s.d.documentElement.dataset.siteLoading==='leaving');
 s.w.eval('showSiteLoading()');s.advance();assert.equal(s.d.documentElement.dataset.siteLoading,'true');assert(!s.d.querySelector('[data-loader]').hidden);s.dom.window.close();
});

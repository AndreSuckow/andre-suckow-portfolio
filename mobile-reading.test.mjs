import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const source=fs.readFileSync('public/mobile-reading.js','utf8');
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
test('board games keep portrait play free of the TV orientation prompt',async()=>{
 const {dom,w,d}=setup();const board=d.createElement('dialog');board.id='board-games-dialog';d.body.append(board);board.showModal();
 d.documentElement.dataset.chapter='sobre';await flush();w.dispatchEvent(new w.Event('resize'));
 assert(!d.querySelector('.mobile-reading').open);board.close();assert(d.querySelector('.mobile-reading').open);dom.window.close();
});
function setup({coarse=true,support=false,preview=false}={}){
 const dom=new JSDOM('<html data-mode="3d" data-chapter="intro"><body><canvas id="stage-canvas" tabindex="-1"></canvas><button data-toggle="mode"></button></body></html>',{url:preview?'http://localhost/?tv=full':'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document;
 w.innerWidth=390;w.innerHeight=844;
 w.matchMedia=()=>({matches:coarse});
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 w.HTMLDialogElement.prototype.close=function(){if(this.open){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));}};
 if(support){
  d.documentElement.requestFullscreen=async()=>{Object.defineProperty(d,'fullscreenElement',{configurable:true,value:d.documentElement});};
  d.exitFullscreen=async()=>{Object.defineProperty(d,'fullscreenElement',{configurable:true,value:null});};
  Object.defineProperty(w.screen,'orientation',{value:{lock:async()=>{throw Error('Unsupported lock');},unlock(){}}});
 }
 w.eval(source);return {dom,w,d};
}

test('TV preview activates only for mobile landscape content and restores the room, controls and normal mode',async()=>{
 const {dom,w,d}=setup({preview:true});const root=d.documentElement;
 root.dataset.chapter='sobre';await flush();assert(!root.dataset.mobileTvPreview);
 w.innerWidth=844;w.innerHeight=390;w.dispatchEvent(new w.Event('resize'));
 assert.equal(root.dataset.mobileTvPreview,'screen');
 const bar=d.querySelector('.tv-reading-preview');assert(!bar.hidden);
 const controls=bar.querySelector('[data-tv-preview-controls]');controls.click();
 assert(root.hasAttribute('data-tv-preview-controls'));assert.equal(controls.getAttribute('aria-pressed'),'true');
 bar.querySelector('[data-tv-preview-back]').click();assert.equal(root.dataset.mobileTvPreview,'room');
 assert(!root.hasAttribute('data-tv-preview-controls'));assert(controls.hidden);
 bar.querySelector('[data-tv-preview-back]').click();assert.equal(root.dataset.mobileTvPreview,'screen');
 root.dataset.chapter='projetos';await flush();assert(!root.dataset.mobileTvPreview);assert(bar.hidden);
 root.dataset.chapter='skills';await flush();assert.equal(root.dataset.mobileTvPreview,'screen');
 root.dataset.mode='2d';await flush();assert(!root.dataset.mobileTvPreview);assert(bar.hidden);
 dom.window.close();
 for(const options of [{preview:false},{preview:true,coarse:false}]){
  const instance=setup(options);instance.w.innerWidth=844;instance.w.innerHeight=390;
  instance.d.documentElement.dataset.chapter='sobre';await flush();
  assert(!instance.d.documentElement.dataset.mobileTvPreview);instance.dom.window.close();
 }
});
test('Portrait prompt appears at TV content and closes on landscape and 2D',async()=>{
 const {dom,w,d}=setup();
 assert(!d.querySelector('dialog').open);
 d.documentElement.dataset.chapter='sobre';await flush();assert(d.querySelector('dialog').open);
 assert(d.querySelector('[data-reading-rotate]').hidden);
 w.innerWidth=844;w.innerHeight=390;w.dispatchEvent(new w.Event('resize'));
 assert(!d.querySelector('dialog').open);assert(d.documentElement.hasAttribute('data-mobile-reading'));
 d.documentElement.dataset.mode='2d';await flush();assert(!d.documentElement.hasAttribute('data-mobile-reading'));
 dom.window.close();
});

test('rotating during poster inspection or a game keeps the portfolio orientation prompt out of the player',async()=>{
 const {dom,w,d}=setup();
 const inspector=d.createElement('dialog');inspector.id='games-notebook';d.body.append(inspector);inspector.showModal();
 d.documentElement.dataset.chapter='hobbies';await flush();
 w.dispatchEvent(new w.Event('resize'));assert(!d.querySelector('.mobile-reading').open);
 inspector.close();assert(d.querySelector('.mobile-reading').open,'The normal TV rotation requirement returns after leaving');
 dom.window.close();
});
test('Desktop is unaffected; portrait 3D cannot bypass rotation',async()=>{
 const desktop=setup({coarse:false});desktop.d.documentElement.dataset.chapter='sobre';await flush();assert(!desktop.d.querySelector('dialog').open);desktop.dom.window.close();
 const {dom,d}=setup();d.documentElement.dataset.chapter='sobre';await flush();
 assert(!d.querySelector('[data-reading-continue]'));assert(!d.querySelector('[data-reading-2d]'));
 const escape=new dom.window.Event('cancel',{cancelable:true});d.querySelector('dialog').dispatchEvent(escape);
 assert(escape.defaultPrevented);assert(d.querySelector('dialog').open);
 d.querySelector('dialog').close();assert(d.querySelector('dialog').open);
 d.documentElement.dataset.chapter='skills';await flush();assert(d.querySelector('dialog').open);dom.window.close();
});
test('Rejected orientation lock returns from fullscreen with manual guidance',async()=>{
 const {dom,d}=setup({support:true});d.documentElement.dataset.chapter='sobre';await flush();
 const rotate=d.querySelector('[data-reading-rotate]');rotate.click();await flush();
 assert(!rotate.disabled);assert(!d.fullscreenElement);
 assert(d.querySelector('.mobile-reading__status').textContent.includes('manualmente'));
 assert(d.querySelector('dialog').open);dom.window.close();
});

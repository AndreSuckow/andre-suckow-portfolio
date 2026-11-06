import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {installMobileMotion} from './public/mobile-motion.js';

function setup(){
 const dom=new JSDOM('<html data-mode="2d"><body><header class="site-header"></header><div class="hero"><div class="hero__bg"><img></div></div><article class="resume-project"><button class="resume-cart"><span class="cart"><span class="cart__label"><span class="cart__title">ONBOARDING</span></span></span></button></article><div class="tab__head">Skills</div></body></html>',{pretendToBeVisual:true});
 const win=dom.window,queries=new Map(),observers=[],animations=[];
 win.matchMedia=query=>{if(!queries.has(query))queries.set(query,{matches:!query.includes('reduced'),listeners:[],addEventListener(_,fn){this.listeners.push(fn)},removeEventListener(){}});return queries.get(query)};
 win.IntersectionObserver=class{constructor(fn){this.callback=fn;observers.push(this)}observe(){}disconnect(){this.disconnected=true}};
 win.HTMLElement.prototype.animate=function(frames,options){const animation={element:this,frames,options,cancelled:false,cancel(){this.cancelled=true}};animations.push(animation);return animation;};
 const api=installMobileMotion({doc:win.document,win});return {dom,win,doc:win.document,queries,observers,animations,api};
}
test('mobile motion restores visible content and background on reduced motion or mode changes',()=>{
 const s=setup(),target=s.doc.querySelector('.tab__head');
 assert(s.doc.documentElement.hasAttribute('data-mobile-motion'));
 s.observers.at(-1).callback([{target,isIntersecting:true}]);assert.equal(s.animations.at(-1).frames.at(-1).opacity,1);
 s.observers.at(-1).callback([{target,isIntersecting:false}]);assert.equal(s.animations.at(-1).frames.at(-1).opacity,0);
 const reduced=[...s.queries].find(([query])=>query.includes('reduced'))[1];reduced.matches=true;reduced.listeners[0]();
 assert(!s.doc.documentElement.hasAttribute('data-mobile-motion'));assert(s.animations.every(a=>a.cancelled));assert.equal(s.doc.querySelector('.hero__bg img').style.transform,'');
 s.api.destroy();assert(!s.doc.querySelector('.mobile-cart-viewer'));s.dom.window.close();
});
test('cartridge can rotate and reset without opening the case, including reduced motion',()=>{
 const s=setup(),button=s.doc.querySelector('.resume-cart'),cart=button.querySelector('.cart');let opens=0;button.addEventListener('click',()=>opens++);
 s.doc.querySelector('.mobile-cart-controls button').click();assert.equal(cart.style.getPropertyValue('--cart-angle'),'45deg');assert.equal(opens,0);
 button.dispatchEvent(new s.win.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(cart.style.getPropertyValue('--cart-angle'),'90deg');
 s.doc.querySelector('.mobile-cart-controls button:last-child').click();assert.equal(cart.style.getPropertyValue('--cart-angle'),'0deg');
 button.click();assert.equal(opens,1);s.api.destroy();s.dom.window.close();
});
test('horizontal dragging rotates and suppresses accidental opening; vertical scrolling does not rotate',()=>{
 const s=setup(),button=s.doc.querySelector('.resume-cart'),cart=button.querySelector('.cart');let opens=0;button.addEventListener('click',()=>opens++);
 const pointer=(type,x,y)=>button.dispatchEvent(new s.win.MouseEvent(type,{clientX:x,clientY:y,button:0,bubbles:true}));
 pointer('pointerdown',20,20);pointer('pointermove',80,22);pointer('pointerup',80,22);button.click();assert.equal(opens,0);assert.equal(cart.style.getPropertyValue('--cart-angle'),'78deg');
 pointer('pointerdown',20,20);pointer('pointermove',21,80);pointer('pointerup',21,80);assert.equal(cart.style.getPropertyValue('--cart-angle'),'78deg');
 s.api.destroy();s.dom.window.close();
});

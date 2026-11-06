import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

test('fading 3D opening disables all links, moves hidden focus and restores interaction at the start or in 2D',async()=>{
 const source=fs.readFileSync('src/boot.js','utf8');
 const start=source.indexOf('function guardHeroInteractions(){'),end=source.indexOf('\nguardHeroInteractions();',start);
 assert(start>=0&&end>start);
 const dom=new JSDOM('<html data-mode="3d"><body><canvas id="stage-canvas" tabindex="-1"></canvas><section class="hero"><div class="interactive"><a href="/cv.pdf">Download</a><a href="https://www.linkedin.com/">LinkedIn</a><a href="https://wa.me/123">WhatsApp</a></div></section></body></html>',{runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,root=w.document.documentElement,hero=w.document.querySelector('.hero');
 w.eval(source.slice(start,end)+';guardHeroInteractions();');
 const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
 assert(!hero.hasAttribute('inert'));
 w.document.querySelector('a').focus();assert(hero.contains(w.document.activeElement));
 root.style.setProperty('--intro-fade','.01');await flush();
 assert(hero.hasAttribute('inert'));assert.equal(w.document.activeElement.id,'stage-canvas');
 root.style.setProperty('--intro-fade','1');await flush();assert(hero.hasAttribute('inert'));
 root.dataset.mode='2d';await flush();assert(!hero.hasAttribute('inert'));
 root.dataset.mode='3d';await flush();assert(hero.hasAttribute('inert'));
 root.style.setProperty('--intro-fade','0');await flush();assert(!hero.hasAttribute('inert'));
 dom.window.close();
});

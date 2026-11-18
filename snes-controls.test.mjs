import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

test('Touch help pauses, blocks a second overlay and restores focus and navigation on close',async()=>{
 const dom=new JSDOM(fs.readFileSync('public/index.html','utf8'),{url:'http://localhost/',runScripts:'outside-only'});
 const w=dom.window,d=w.document;
 d.querySelector('.snes-pad').hidden=false;
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 const events=[];
 d.addEventListener('portfolio:pause',e=>events.push(e.detail));
 w.eval(fs.readFileSync('public/snes-controls.js','utf8'));
 const trigger=d.querySelector('[data-controls-help]'),help=d.querySelector('#controls-help-dialog'),pause=d.querySelector('#pause-dialog');
 trigger.focus();trigger.click();
 assert(help.open);assert.equal(d.documentElement.dataset.paused,'true');
 assert(d.activeElement.hasAttribute('data-controls-close'));
 d.dispatchEvent(new w.CustomEvent('portfolio:toggle-pause'));assert(!pause.open);
 help.querySelector('[data-controls-close]').click();
 assert(!help.open);assert.equal(d.activeElement,trigger);assert(!d.documentElement.hasAttribute('data-paused'));
 assert.deepEqual(events,[true,false]);
 trigger.click();d.documentElement.dataset.mode='2d';await new Promise(r=>setTimeout(r,0));
 assert(!help.open);assert(!d.documentElement.hasAttribute('data-paused'));
 dom.window.close();
});

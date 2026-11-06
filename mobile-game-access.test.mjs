import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {installMobile2DGameAccess} from './public/game-access.js';

test('only mobile 2D disables game entry points, preserving desktop 2D and mobile 3D',async()=>{
 const dom=new JSDOM('<html data-mode="2d"><body><div class="poster-gallery"><button data-room-inspect="poster-mario">Jogar</button></div><button data-room-board>Tabuleiro</button><button id="contact">Contato</button></body></html>');
 const d=dom.window.document,media=new dom.window.EventTarget();media.matches=true;
 const policy=installMobile2DGameAccess({doc:d,media}),gallery=d.querySelector('.poster-gallery');let games=0,contacts=0;
 for(const selector of ['[data-room-inspect]','[data-room-board]'])d.querySelector(selector).addEventListener('click',()=>games++);
 d.querySelector('#contact').addEventListener('click',()=>contacts++);
 d.querySelector('[data-room-inspect]').click();d.querySelector('[data-room-board]').click();d.querySelector('#contact').click();assert.equal(games,0);assert.equal(contacts,1);assert(gallery.hasAttribute('inert'));
 d.documentElement.dataset.mode='3d';await new Promise(r=>setTimeout(r,0));d.querySelector('[data-room-inspect]').click();assert.equal(games,1);assert(!gallery.hasAttribute('inert'));
 d.documentElement.dataset.mode='2d';media.matches=false;media.dispatchEvent(new dom.window.Event('change'));d.querySelector('[data-room-inspect]').click();assert.equal(games,2);assert(!gallery.hasAttribute('inert'));
 policy.dispose();dom.window.close();
});

test('switching to mobile 2D closes games already open and keeps non-game object inspection available',()=>{
 const dom=new JSDOM('<html data-mode="2d"><body><dialog id="games-notebook" open data-object="poster-mario"></dialog><dialog id="board-games-dialog" open></dialog></body></html>'),d=dom.window.document;
 dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 const policy=installMobile2DGameAccess({doc:d,media:{matches:true}});assert(!d.querySelector('dialog[open]'));
 const inspector=d.querySelector('#games-notebook');inspector.dataset.object='family';inspector.setAttribute('open','');
 policy.dispose();const second=installMobile2DGameAccess({doc:d,media:{matches:true}});assert(inspector.open);second.dispose();dom.window.close();
});

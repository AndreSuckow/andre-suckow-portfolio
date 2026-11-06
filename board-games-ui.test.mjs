import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

test('board modal selects all four games, validates interactions, preserves sessions and restores focus on close',async()=>{
 const dom=new JSDOM('<button id="trigger">Abrir tabuleiro</button><canvas id="stage-canvas" tabindex="-1"></canvas>',{url:'http://localhost/',pretendToBeVisual:true});
 const w=dom.window,oldDocument=globalThis.document,oldCustomEvent=globalThis.CustomEvent;
 globalThis.document=w.document;globalThis.CustomEvent=w.CustomEvent;
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 try{
  const {openBoardGames}=await import('./public/board-games/ui.js?ui-test');const d=w.document,trigger=d.querySelector('#trigger');trigger.focus();d.body.style.overflow='clip';
  openBoardGames();const dialog=d.querySelector('#board-games-dialog');assert(dialog.open);assert.equal(d.body.style.overflow,'hidden');
  const click=selector=>{const button=dialog.querySelector(selector);assert(button,selector);button.click();};
  click('[data-board-game="trilha"]');assert.equal(dialog.querySelectorAll('.morris-board .board-cell').length,24);click('[data-cell="0"]');assert.match(dialog.querySelector('[data-board-turn]').textContent,/Pretas/);
  click('[data-board-action="menu"]');click('[data-board-game="damas"]');assert.equal(dialog.querySelectorAll('.board-disc').length,24);click('[data-cell="40"]');assert(dialog.querySelector('[data-cell="33"]').classList.contains('legal'));click('[data-cell="33"]');assert.equal(dialog.querySelectorAll('[data-board-history] li').length,1);
  click('[data-board-action="restart"]');assert(!dialog.querySelector('[data-reset-confirm]').hidden);click('[data-board-action="cancel-reset"]');assert.equal(dialog.querySelectorAll('[data-board-history] li').length,1);
  click('[data-board-action="restart"]');click('[data-board-action="confirm-reset"]');assert.equal(dialog.querySelectorAll('[data-board-history] li').length,0);
  click('[data-board-action="menu"]');click('[data-board-game="xadrez"]');assert.equal(dialog.querySelectorAll('.chess-piece').length,32);click('[data-cell="52"]');click('[data-cell="36"]');assert.equal(dialog.querySelector('[data-board-history] li').textContent,'e4');assert(!dialog.querySelector('[data-promotion-label]').hidden);
  click('[data-board-action="menu"]');click('[data-board-game="ludo"]');assert.equal(dialog.querySelectorAll('.ludo-pawn').length,16);click('[data-board-action="roll"]');assert(dialog.querySelector('[data-board-history] li'));
  click('[data-board-action="menu"]');click('[data-board-game="trilha"]');assert.equal(dialog.querySelectorAll('[data-board-history] li').length,1,'Switching games keeps the existing session');
  click('[data-board-action="close"]');assert(!dialog.open);assert.equal(d.body.style.overflow,'clip');assert.equal(d.activeElement,trigger);
 }finally{globalThis.document=oldDocument;globalThis.CustomEvent=oldCustomEvent;dom.window.close();}
});

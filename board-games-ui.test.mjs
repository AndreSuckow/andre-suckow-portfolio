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
  const checkerRequests=[];d.addEventListener('board:checkers-render',event=>checkerRequests.push(event.detail));
  openBoardGames();const dialog=d.querySelector('#board-games-dialog');assert(dialog.open);assert.equal(d.body.style.overflow,'hidden');
  const click=selector=>{const button=dialog.querySelector(selector);assert(button,selector);button.click();};
  click('[data-board-game="trilha"]');assert.equal(dialog.querySelectorAll('.morris-board .board-cell').length,24);click('[data-cell="0"]');assert.match(dialog.querySelector('[data-board-turn]').textContent,/Pretas/);
  click('[data-board-action="menu"]');click('[data-board-game="damas"]');assert.equal(dialog.querySelectorAll('.board-disc').length,24);click('[data-cell="40"]');assert(dialog.querySelector('[data-cell="33"]').classList.contains('legal'));click('[data-cell="33"]');assert.equal(dialog.querySelectorAll('[data-board-history] li').length,1);
  const checkerCanvas=dialog.querySelector('.checker-model-canvas');assert(checkerCanvas);assert.equal(checkerCanvas.getAttribute('aria-hidden'),'true');assert(checkerRequests.length>=3);assert(checkerRequests.every(request=>request.canvas===checkerCanvas&&request.board.length===64));assert.equal(checkerRequests.at(-1).board[33],1);assert(!dialog.querySelector('[data-checker-credit]').hidden);
  click('[data-board-action="restart"]');assert(!dialog.querySelector('[data-reset-confirm]').hidden);click('[data-board-action="cancel-reset"]');assert.equal(dialog.querySelectorAll('[data-board-history] li').length,1);
  click('[data-board-action="restart"]');click('[data-board-action="confirm-reset"]');assert.equal(dialog.querySelectorAll('[data-board-history] li').length,0);
  click('[data-board-action="menu"]');click('[data-board-game="xadrez"]');assert.equal(dialog.querySelectorAll('.chess-piece').length,32);click('[data-cell="52"]');click('[data-cell="36"]');assert.equal(dialog.querySelector('[data-board-history] li').textContent,'e4');assert(!dialog.querySelector('[data-promotion-label]').hidden);
  click('[data-board-action="menu"]');click('[data-board-game="ludo"]');assert.equal(dialog.querySelectorAll('.ludo-pawn').length,16);click('[data-board-action="roll"]');assert(dialog.querySelector('[data-board-history] li'));
  click('[data-board-action="menu"]');click('[data-board-game="trilha"]');assert.equal(dialog.querySelectorAll('[data-board-history] li').length,1,'Switching games keeps the existing session');
  click('[data-board-action="close"]');assert(!dialog.open);assert.equal(d.body.style.overflow,'clip');assert.equal(d.activeElement,trigger);
 }finally{globalThis.document=oldDocument;globalThis.CustomEvent=oldCustomEvent;dom.window.close();}
});

test('Dama keeps human turns and computer replies safely cancel on menu or opponent changes',async()=>{
 const dom=new JSDOM('<button id="trigger">Tabuleiro</button><canvas id="stage-canvas"></canvas>',{url:'http://localhost/',pretendToBeVisual:true}),w=dom.window,d=w.document,oldDocument=globalThis.document,oldEvent=globalThis.CustomEvent;
 globalThis.document=d;globalThis.CustomEvent=w.CustomEvent;
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'))};
 let dialog;
 try{
  const {openBoardGames}=await import('./public/board-games/ui.js?opponent-ui');openBoardGames();dialog=d.getElementById('board-games-dialog');
  const click=selector=>dialog.querySelector(selector).click(),count=()=>dialog.querySelectorAll('[data-board-history] li').length;
  const mode=value=>{const select=dialog.querySelector('[data-damas-mode]');select.value=value;select.dispatchEvent(new w.Event('change',{bubbles:true}))};
  click('[data-board-game="damas"]');click('[data-cell="40"]');click('[data-cell="33"]');assert.equal(count(),1);
  await new Promise(r=>setTimeout(r,450));assert.equal(count(),1,'human mode never moves automatically');
  mode('computer');assert([...dialog.querySelectorAll('.board-cell')].every(b=>b.disabled));assert.match(dialog.querySelector('[data-board-status]').textContent,/pensando/);
  for(let i=0;i<150&&count()<2;i++)await new Promise(r=>setTimeout(r,20));assert.equal(count(),2);assert.match(dialog.querySelector('[data-board-turn]').textContent,/Brancas/);
  mode('human');assert.equal(count(),2,'changing opponent keeps the current position');
  const {damaActions}=await import('./public/board-games/damas.js');const board=[...dialog.querySelectorAll('.board-cell')].map(cell=>{const p=cell.querySelector('.board-disc');return p?(p.classList.contains('disc-white')?1:-1)*(p.textContent==='D'?2:1):0}),move=damaActions(board,1)[0];
  click(`[data-cell="${move.from}"]`);click(`[data-cell="${move.to}"]`);assert.equal(count(),3);
  mode('computer');click('[data-board-action="menu"]');await new Promise(r=>setTimeout(r,500));assert.equal(count(),3,'leaving cancels the queued reply');
  click('[data-board-game="damas"]');mode('human');await new Promise(r=>setTimeout(r,500));assert.equal(count(),3,'switching to human cancels the reply');assert.match(dialog.querySelector('[data-board-turn]').textContent,/Pretas/);
 }finally{if(dialog?.open)dialog.close();globalThis.document=oldDocument;globalThis.CustomEvent=oldEvent;dom.window.close();}
});

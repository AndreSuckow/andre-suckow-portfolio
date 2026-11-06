import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createDamas,damaActions,damaBoardAfter} from './public/board-games/damas.js';
import {chooseDamaMove} from './public/board-games/damas-computer.js';
import {createDamaOpponent} from './public/board-games/damas-opponent.js';
import {snapshotTrilhaAction,animateTrilhaAction} from './public/board-games/trilha-motion.js';

test('computer chooses legal moves without changing the position and obeys mandatory captures and promotion',()=>{
 const game=createDamas();game.play(game.legalActions()[0]);const before=JSON.stringify(game.state),move=chooseDamaMove(game.state.board,-1,{now:()=>0});
 assert(damaActions(game.state.board,-1).some(a=>JSON.stringify(a)===JSON.stringify(move)));assert.equal(JSON.stringify(game.state),before);
 const board=Array(64).fill(0);board[63-18]=-1;board[63-11]=1;board[63-22]=1;
 const capture=chooseDamaMove(board,-1,{now:()=>0});assert.equal(capture.captures.length,2);assert.equal(capture.piece,-2);
 const next=damaBoardAfter(board,capture);assert.equal(next[capture.to],-2);assert.equal(next.filter(p=>p===1).length,0);
 assert.equal(chooseDamaMove(Array(64).fill(0),-1),null);
 assert(damaActions(game.state.board,-1).some(a=>JSON.stringify(a)===JSON.stringify(chooseDamaMove(game.state.board,-1,{nodeLimit:0,now:()=>0}))));
});

test('computer jobs cancel safely; stale workers cannot move or terminate a newer job',()=>{
 const jobs=new Map(),workers=[],results=[];let id=0;
 class Worker{constructor(){workers.push(this)}postMessage(value){this.message=value}terminate(){this.terminated=true}}
 const opponent=createDamaOpponent({WorkerClass:Worker,setTimer:fn=>{jobs.set(++id,fn);return id},clearTimer:i=>jobs.delete(i),choose:()=>({fallback:true})});
 const board=Array(64).fill(0);board[1]=-1;
 const run=()=>{const [key,fn]=jobs.entries().next().value;jobs.delete(key);fn()};
 opponent.request(board,-1,move=>results.push(move));board[1]=0;run();assert.equal(workers[0].message.board[1],-1);
 opponent.cancel();opponent.request(board,-1,move=>results.push(move));run();workers[0].onmessage({data:{error:true}});assert(!workers[1].terminated);assert.equal(results.length,0);
 workers[1].onmessage({data:{move:{to:12}}});assert.deepEqual(results,[{to:12}]);assert.equal(opponent.pending,false);
 opponent.request(board,-1,move=>results.push(move));opponent.cancel();assert.equal(jobs.size,0);assert.equal(results.length,1);
 opponent.request(board,-1,move=>results.push(move));run();workers[2].onerror();assert.deepEqual(results.at(-1),{fallback:true});
});

test('Trilha moves a visible stone between points and restores board input after completion or cancellation',async()=>{
 const dom=new JSDOM('<div id="surface"><div class="morris-board"><button data-cell="0"><span class="board-disc disc-white"></span></button><button data-cell="1"><span class="board-disc disc-white"></span></button></div></div>',{pretendToBeVisual:true}),win=dom.window,surface=win.document.getElementById('surface'),board=surface.firstElementChild;let finish,reject,frames;
 win.matchMedia=()=>({matches:false});win.HTMLElement.prototype.animate=function(keyframes){frames=keyframes;return {finished:new Promise((resolve,no)=>{finish=resolve;reject=no}),cancel(){reject(Error('cancelled'))}}};
 board.getBoundingClientRect=()=>({left:0,top:0});const pieces=board.querySelectorAll('.board-disc');pieces[0].getBoundingClientRect=()=>({left:10,top:20,width:30,height:30});pieces[1].getBoundingClientRect=()=>({left:110,top:20,width:30,height:30});
 const action={type:'move',from:0,to:1},snapshot=snapshotTrilhaAction(surface,action);pieces[0].remove();
 const motion=animateTrilhaAction(surface,action,snapshot);assert(motion.active);assert(board.querySelector('.trilha-moving-piece'));assert.equal(frames[0].transform,'translate(-100px,0px)');assert.equal(pieces[1].style.visibility,'hidden');assert([...board.querySelectorAll('button')].every(b=>b.disabled));
 finish();await Promise.resolve();assert(!motion.active);assert(!board.querySelector('.trilha-moving-piece'));assert.equal(pieces[1].style.visibility,'');assert([...board.querySelectorAll('button')].every(b=>!b.disabled));
 const second=animateTrilhaAction(surface,action,snapshot);second.cancel();await Promise.resolve();assert(!second.active);assert.equal(board.getAttribute('aria-busy'),null);
 win.matchMedia=()=>({matches:true});assert.equal(animateTrilhaAction(surface,action,snapshot),null);dom.window.close();
});

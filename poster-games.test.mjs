import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const games=JSON.parse(fs.readFileSync('poster-games.json','utf8'));
function setup(){
 const html=fs.readFileSync('src/room-discoveries.html','utf8').replace('type="application/json">[]','type="application/json">'+JSON.stringify(games));
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://portfolio.test/'}),w=dom.window,d=w.document;
 w.matchMedia=()=>({matches:true});w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 w.eval(fs.readFileSync('public/room-discoveries.js','utf8').replace(/^import .*;\r?\n/gm,''));
 w.eval(fs.readFileSync('public/poster-games.js','utf8').replaceAll('import.meta.url',JSON.stringify('https://portfolio.test/poster-games.js')));
 return {dom,w,d,dialog:d.querySelector('dialog'),player:d.querySelector('[data-poster-game]'),frame:d.querySelector('iframe')};
}
test('all four supplied games open from the shared poster inspector without loading a provider early',async()=>{
 const {dom,w,d,dialog,player,frame}=setup();
 try{
  assert.equal(games.length,4);assert.equal(frame.getAttribute('src'),null);
  assert.match(frame.getAttribute('allow'),/fullscreen 'none'/);assert(!frame.hasAttribute('allowfullscreen'));
  for(const game of games){
   const trigger=d.querySelector(`[data-room-inspect="${game.id}"]`);trigger.focus();trigger.click();await new Promise(r=>setTimeout(r,10));
   assert(dialog.open);assert.equal(dialog.dataset.object,game.id);assert(!d.querySelector('[data-poster-actions]').hidden);
   assert.equal(d.querySelector('[data-poster-game-title]').textContent,game.gameTitle);
   assert.equal(d.querySelector('[data-notebook-view="in"] small').textContent,'Maximizar');
   assert.equal(d.querySelector('[data-notebook-view="out"] small').textContent,'Diminuir');
   assert.equal(d.querySelector('[data-poster-play]').textContent.trim(),'▶ Jogar');
   assert(!d.querySelector('[data-rom-options]').open,'No local file is required by the primary flow');
   assert.equal(d.querySelector('[data-game-provider]').textContent,'Jogo via '+game.provider);
   let synchronous=false;player.requestFullscreen=()=>{synchronous=true;return Promise.reject(Error('denied'));};
   d.querySelector('[data-poster-play]').click();assert(synchronous);assert.equal(frame.src,game.embedUrl);assert(!player.hidden);
   await new Promise(r=>setTimeout(r,0));assert.match(d.querySelector('[data-game-status]').textContent,/navegador/);
   d.querySelector('[data-game-exit]').click();assert(!dialog.open);assert(player.hidden);assert.equal(frame.getAttribute('src'),null);
   assert.equal(d.activeElement,trigger);assert.equal(d.body.style.overflow,'');
  }
 }finally{dom.window.close();}
});
test('late fullscreen completion after leaving is undone and Escape unloads the game',async()=>{
 const {dom,w,d,dialog,player,frame}=setup();
 try{
  let resolve,exits=0;player.requestFullscreen=()=>new Promise(r=>{resolve=r;});
  d.exitFullscreen=async()=>{exits++;Object.defineProperty(d,'fullscreenElement',{configurable:true,value:null});};
  d.querySelector('[data-room-inspect="poster-megaman"]').click();await new Promise(r=>setTimeout(r,10));
  d.querySelector('[data-poster-play]').click();
  dialog.dispatchEvent(new w.Event('cancel',{cancelable:true}));assert(!dialog.open);assert.equal(frame.getAttribute('src'),null);
  Object.defineProperty(d,'fullscreenElement',{configurable:true,value:player});resolve();await new Promise(r=>setTimeout(r,0));
  assert.equal(exits,1);assert(player.hidden);
 }finally{dom.window.close();}
});

test('local ROM validation, secure handoff, retry, replacement and cleanup preserve the host controls',async()=>{
 const {dom,w,d,dialog,player,frame}=setup();
 try{
  player.requestFullscreen=async()=>{};
  const input=d.querySelector('[data-rom-file]');
  const choose=file=>{d.querySelector('[data-rom-options]').open=true;d.querySelector('[data-rom-choose]').click();Object.defineProperty(input,'files',{configurable:true,value:file?[file]:[]});input.dispatchEvent(new w.Event('change'));};
  d.querySelector('[data-room-inspect="poster-mario"]').click();await new Promise(r=>setTimeout(r,10));
  choose(null);assert(!dialog.dataset.playing,'Cancelling leaves the poster open');
  choose(new w.File(['x'],'image.png'));assert.match(d.querySelector('[data-rom-error]').textContent,/\.sfc/);assert.equal(frame.getAttribute('src'),null);
  choose(new w.File(['x'],'empty.sfc'));assert.match(d.querySelector('[data-rom-error]').textContent,/pequeno/);
  const large=new w.File(['x'],'large.sfc');Object.defineProperty(large,'size',{value:16*1024*1024+1});choose(large);assert.match(d.querySelector('[data-rom-error]').textContent,/16 MB/);
  const file=new w.File([new Uint8Array(32768)],'my-homebrew.SFC');choose(file);
  assert.equal(dialog.dataset.playing,'true');assert.equal(new URL(frame.src).pathname,'/emulator/index.html');
  assert(!d.querySelector('[data-game-title]').textContent.includes('Super Mario'),'The chosen filename, not the poster title, identifies the local game');
  assert(d.querySelector('[data-game-external]').hidden);assert(!player.querySelector('[data-rom-choose]').hidden);
  let sent=[];frame.contentWindow.postMessage=(...args)=>sent.push(args);
  const session=new URL(frame.src).searchParams.get('session');
  const send=(data,source=frame.contentWindow,origin=w.location.origin)=>w.dispatchEvent(new w.MessageEvent('message',{data,source,origin}));
  send({type:'local-rom:ready',session},w);send({type:'local-rom:ready',session},frame.contentWindow,'https://other.test');send({type:'local-rom:ready',session:'old'});assert.equal(sent.length,0);
  send({type:'local-rom:ready',session});assert.equal(sent.length,1);assert.equal(sent[0][0].file,file);assert.equal(sent[0][1],w.location.origin);
  send({type:'local-rom:status',session,state:'started'});assert.match(d.querySelector('[data-game-status]').textContent,/my-homebrew/);
  d.querySelector('[data-game-retry]').click();assert.notEqual(new URL(frame.src).searchParams.get('session'),session);
  send({type:'local-rom:status',session,state:'error'});assert(!d.querySelector('[data-game-status]').textContent.includes('Não foi possível'));
  choose(new w.File([new Uint8Array(32768)],'second.smc'));assert.equal(d.querySelector('[data-game-title]').textContent,'second.smc');
  d.querySelector('[data-game-exit]').click();assert(!dialog.open);assert.equal(frame.getAttribute('src'),null);
 }finally{dom.window.close();}
});

test('the local runner only accepts its parent session and passes a File directly to the pinned emulator',()=>{
 const dom=new JSDOM('<div id="game"></div><p id="message"></p>',{runScripts:'outside-only',url:'https://portfolio.test/emulator/index.html?session=1'}),w=dom.window;
 try{
  w.eval(fs.readFileSync('public/emulator/player.js','utf8'));
  const file=new w.File([new Uint8Array(32768)],'test.sfc');
  const send=(session,origin=w.location.origin)=>w.dispatchEvent(new w.MessageEvent('message',{source:w.parent,origin,data:{type:'local-rom:load',session,file}}));
  send('stale');send('1','https://other.test');assert.equal(w.document.querySelectorAll('script').length,0);
  send('1');assert.equal(w.EJS_gameUrl,file);assert.equal(w.EJS_core,'snes');assert(w.EJS_disableLocalStorage);assert.equal(w.EJS_Buttons.fullscreen,false);
  assert.match(w.document.querySelector('script').src,/\/4\.2\.3\/data\/loader\.js$/);
  const start=w.document.createElement('div');start.className='ejs_start_button';w.document.body.append(start);let clicks=0;start.addEventListener('click',()=>clicks++);w.EJS_ready();
  assert.equal(start.getAttribute('role'),'button');assert.equal(start.tabIndex,0);start.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));assert.equal(clicks,1);
  send('1');assert.equal(w.document.querySelectorAll('script').length,1);
  w.document.querySelector('script').dispatchEvent(new w.Event('error'));assert.match(w.document.querySelector('#message').textContent,/Não foi possível/);
 }finally{dom.window.close();}
});

test('the approved dynamic-code permission is confined to the local emulator page',()=>{
 const runner=fs.readFileSync('public/emulator/index.html','utf8');
 assert(runner.includes("'unsafe-eval'"));assert(runner.includes("form-action 'none'"));
 assert(!fs.readFileSync('src/room-discoveries.html','utf8').includes("'unsafe-eval'"));
 assert(!fs.readFileSync('public/index.html','utf8').includes("'unsafe-eval'"));
});

test('the original games use published embeds while unavailable Super Mario World retains its existing provider',()=>{
 for(const id of ['poster-dkc3','poster-turtles','poster-megaman']){
  const game=games.find(item=>item.id===id);assert.equal(game.provider,'RetroGames.cc');
  assert.match(game.embedUrl,/^https:\/\/www\.retrogames\.cc\/embed\/\d+-/);
 }
 assert.match(games.find(item=>item.id==='poster-turtles').embedUrl,/24621-teenage-mutant-ninja-turtles-iv-turtles-in-time-usa/);
 assert.match(games.find(item=>item.id==='poster-dkc3').embedUrl,/24602-donkey-kong-country-3-dixie-kong-s-double-trouble-usa-en-fr/);
 assert.equal(games.find(item=>item.id==='poster-mario').embedUrl,'https://classicgamezone.com/pt/games/super-mario-world');
});

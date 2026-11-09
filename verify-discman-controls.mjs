// Optional real-browser gameplay check using an isolated headless Chrome profile.
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import os from 'node:os';
const executable=process.env.GAME_TEST_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base=process.env.GAME_TEST_URL||'http://127.0.0.1:4173/cs/';
const output=path.resolve('tmp/portfolio-browser');fs.mkdirSync(output,{recursive:true});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function connect(url){
 const ws=new WebSocket(url),pending=new Map();let next=0;const errors=[];
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 ws.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const request=pending.get(message.id);if(request){clearTimeout(request.timeout);pending.delete(message.id);message.error?request.reject(Error(JSON.stringify(message.error))):request.resolve(message.result);}}else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);});
 return {errors,send:(method,params={})=>new Promise((resolve,reject)=>{const id=++next,timeout=setTimeout(()=>{pending.delete(id);reject(Error(`Timeout: ${method}`));},30000);pending.set(id,{resolve,reject,timeout});ws.send(JSON.stringify({id,method,params}));}),close:()=>ws.close()};
}
let browser,page,child;
try{
 assert(fs.existsSync(executable),'Chrome not found; set GAME_TEST_CHROME.');
 const response=await fetch(base);assert.equal(response.status,200,'Start npm run dev before this check.');
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'cv-game-browser-'));
 const localTest=new URL(base).hostname==='127.0.0.1'||new URL(base).hostname==='localhost';
 const testSandboxArgs=process.env.GAME_TEST_NO_SANDBOX==='1'&&localTest?['--no-sandbox']:[];
 child=spawn(executable,['--headless=new',...testSandboxArgs,'--disable-extensions','--disable-background-networking','--no-first-run','--no-default-browser-check','--use-angle=swiftshader','--enable-unsafe-swiftshader','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
 const endpoint=await new Promise((resolve,reject)=>{let buffer='';const timer=setTimeout(()=>reject(Error('Chrome did not start within 15 seconds.')),15000);child.once('error',reject);child.stderr.on('data',data=>{buffer+=data;const match=buffer.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});});
 browser=await connect(endpoint);
 const targets=await (await fetch(`http://${new URL(endpoint).host}/json/list`)).json();
 page=await connect(targets.find(target=>target.type==='page').webSocketDebuggerUrl);
 await page.send('Page.enable');await page.send('Runtime.enable');await page.send('Network.enable');
 await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__inspectionDraws={room:0,object:0};for(const name of ['drawElements','drawArrays']){const native=WebGL2RenderingContext.prototype[name];WebGL2RenderingContext.prototype[name]=function(...args){window.__inspectionDraws[this.canvas.hasAttribute('data-notebook-canvas')?'object':'room']++;return native.apply(this,args);};}`});
 await page.send('Page.addScriptToEvaluateOnNewDocument',{source:'try{localStorage.setItem("andre:prefs",JSON.stringify({...JSON.parse(localStorage.getItem("andre:prefs")||"{}"),mode:"2d"}))}catch{}'});
 const evaluate=async expression=>{const result=await page.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
 const until=async(expression,label)=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await wait(60);}throw Error(`Timed out: ${label}`);};



 await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__discAudio=[];const NativeAudio=window.Audio;window.Audio=function(...args){const a=new NativeAudio(...args);window.__discAudio.push(a);return a;};`});
 await page.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await page.send('Page.navigate',{url:base});
 await until('document.documentElement.dataset.mode==="3d"&&document.querySelector("[data-loader]").hidden&&document.documentElement.dataset.roomVersion==="novo-quarto-3d"','loaded');
 await evaluate('document.querySelector("[data-room-inspect=discman]").click()');
 await until('document.querySelector("#games-notebook").open&&document.querySelector("[data-notebook-canvas]").dataset.ready==="true"','discman');
 await until('document.querySelector("[data-notebook-canvas]").getAnimations().every(a=>a.playState==="finished")','animation');await wait(200);
 await evaluate('window.__inspectionDraws={room:0,object:0}');await until('window.__inspectionDraws.object>0','inspection continues drawing');
 const drawCounts=await evaluate('window.__inspectionDraws');assert.equal(drawCounts.room,0,'Room rendering suspends behind inspection: '+JSON.stringify(drawCounts));
 const objectBounds=()=>evaluate(`(async()=>{for(let attempt=0;attempt<60;attempt++){await new Promise(requestAnimationFrame);const c=document.querySelector('[data-notebook-canvas]'),r=c.getBoundingClientRect(),g=c.getContext('webgl2')||c.getContext('webgl');const copy=document.createElement('canvas');copy.width=c.width;copy.height=c.height;const ctx=copy.getContext('2d');ctx.drawImage(c,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;let left=c.width,top=c.height,right=0,bottom=0;for(let y=0;y<c.height;y+=2)for(let x=0;x<c.width;x+=2)if(d[(y*c.width+x)*4+3]>40){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}if(right>0)return {left:r.x+left/c.width*r.width,top:r.y+top/c.height*r.height,right:r.x+right/c.width*r.width,bottom:r.y+bottom/c.height*r.height,area:{left:r.left,top:r.top,right:r.right,bottom:r.bottom}}}throw Error("No rendered inspection frame")})()`);
 const bounds=await objectBounds();console.log('Desktop bounds',bounds);assert(bounds.right-bounds.left>450&&bounds.bottom-bounds.top>450,'Discman opens large on desktop');
 const physicalTargets=await evaluate(`(()=>{const c=document.querySelector('[data-notebook-canvas]'),groups={};for(let y=${Math.floor(bounds.bottom-90)};y<${Math.ceil(bounds.bottom)};y+=4)for(let x=${Math.floor((bounds.left+bounds.right)/2)};x<${Math.ceil(bounds.right)};x+=4){c.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:x,clientY:y,pointerId:1}));if(c.title){(groups[c.title]||=[]).push({x,y});}}return Object.fromEntries(Object.entries(groups).map(([name,points])=>{const bottom=Math.max(...points.map(p=>p.y)),row=points.filter(p=>p.y>bottom-12);return [name,{point:row[Math.floor(row.length/2)],count:points.length}]}))})()`);console.log('Physical physicalTargets',physicalTargets);
 const move=p=>page.send('Input.dispatchMouseEvent',{type:'mouseMoved',...p});
 const press=p=>page.send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',buttons:1,clickCount:1});
 const release=p=>page.send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});
 const click=async p=>{await move(p);await press(p);await release(p);};
 const lidTarget=await evaluate(`(()=>{const b=document.querySelector('[data-model-action=lid]:not([hidden])');if(!b)return null;const r=b.getBoundingClientRect(),p={x:r.x+r.width/2,y:r.y+r.height/2},c=document.querySelector('[data-notebook-canvas]');c.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:p.x,clientY:p.y,pointerId:1}));return c.title==='Fechar tampa'?p:null})()`);
 assert(lidTarget,'OPEN has clickable physical geometry');
 assert(await evaluate('document.querySelectorAll(".model-control:not([hidden])").length>=4'),'Visible interaction markers');
 await click(lidTarget);await until('document.querySelector("[data-notebook-canvas]").dataset.lid==="closed"&&document.querySelector("[data-model-action=lid]").getAttribute("aria-busy")==="false"','OPEN closes lid');await wait(150);
 fs.writeFileSync(path.join(output,'discman-lid-closed.png'),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 const closedBounds=await objectBounds();console.log('Closed bounds',closedBounds);
 assert(closedBounds.bottom-closedBounds.top<bounds.bottom-bounds.top-120,'Actual lid geometry closes');
 assert(await evaluate('(()=>{const b=document.querySelector("[data-model-action=lid]");b.focus();return document.activeElement===b})()'),'Closed OPEN control remains visible and focusable');
 await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter'});await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter'});await until('document.querySelector("[data-notebook-canvas]").dataset.lid==="open"&&document.querySelector("[data-model-action=lid]").getAttribute("aria-busy")==="false"','keyboard opens lid');await wait(150);
 await page.send('Page.captureScreenshot',{format:'png'});
 for(const key of ['Ouvir','Pausar','Retroceder: faixa anterior','Volume: arraste para os lados'])assert(physicalTargets[key],key+' has physical geometry');
 await click(physicalTargets['Ouvir'].point);await until('window.__discAudio.some(a=>!a.paused&&a.currentTime>0)','physical Ouvir plays audio');
 await click(physicalTargets['Pausar'].point);await until('window.__discAudio.every(a=>a.paused)','physical Pausar');
 await click(physicalTargets['Retroceder: faixa anterior'].point);await until('document.querySelector("[data-discman-title]").textContent.includes("Evanescence")','physical Retroceder selects previous available track');
 await click(physicalTargets['Ouvir'].point);await until('window.__discAudio.some(a=>!a.paused&&a.currentTime>0)','second track plays');
 const wheel=physicalTargets['Volume: arraste para os lados'].point;
 await move(wheel);await press(wheel);await move({x:wheel.x+42,y:wheel.y});await release({x:wheel.x+42,y:wheel.y});
 await until('window.__discAudio.some(a=>a.volume>.95)&&document.querySelector("[data-discman-volume]").value==="100"','drag right raises real audio volume');
 await move(wheel);await press(wheel);await move({x:wheel.x-70,y:wheel.y});await release({x:wheel.x-70,y:wheel.y});
 await until('window.__discAudio.some(a=>a.volume<.55)&&Number(document.querySelector("[data-discman-volume]").value)<55','drag left lowers volume');
 fs.writeFileSync(path.join(output,'discman-desktop-controls.png'),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await click(physicalTargets['Pausar'].point);await until('window.__discAudio.every(a=>a.paused)','physical pause after volume adjustment');
 await evaluate('document.querySelector("[data-notebook-canvas]").focus()');
 for(const [key,code] of [['o','KeyO'],['p','KeyP']]){await page.send('Input.dispatchKeyEvent',{type:'keyDown',key,code});await page.send('Input.dispatchKeyEvent',{type:'keyUp',key,code});await until(key==='o'?'window.__discAudio.some(a=>!a.paused)':'window.__discAudio.every(a=>a.paused)','keyboard '+key);}
 const grip={x:(bounds.left+bounds.right)/2,y:(bounds.top+bounds.bottom)/2};
 await move(grip);await press(grip);await move({x:grip.x+60,y:grip.y-35});
 await until('getComputedStyle(document.querySelector("[data-model-controls]")).visibility==="hidden"','rotation skips marker picking');
 await release({x:grip.x+60,y:grip.y-35});
 await until('getComputedStyle(document.querySelector("[data-model-controls]")).visibility==="visible"','release restores interactive markers');
 assert(await evaluate('document.querySelector("[data-notebook-canvas]").dataset.lid==="open"'),'Dragging does not activate OPEN');
 await evaluate('document.querySelector("[data-notebook-canvas]").dispatchEvent(new KeyboardEvent("keydown",{key:"Home",bubbles:true}))');
 for(const [width,height] of [[1440,900],[844,390],[568,320],[390,844]]){
  await page.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1000});await wait(250);
  for(const direction of ['in','out']){
   await evaluate(`(()=>{const b=document.querySelector('[data-notebook-view=${direction}]');for(let i=0;i<12;i++)b.click()})()`);await wait(100);const b=await objectBounds();
   assert(b.left>=b.area.left+22&&b.right<=b.area.right-22&&b.top>=b.area.top+22&&b.bottom<=b.area.bottom-22,'Discman stays inside canvas at '+width+' '+direction);
  }
  assert(await evaluate(`getComputedStyle(document.querySelector('.discman-player__controls')).display===${JSON.stringify(width<=1000?'grid':'none')}`),'Responsive playback controls '+width);
  if(width<=1000){
   assert(await evaluate('Array.from(document.querySelectorAll(".discman-player__controls button")).every(b=>{const r=b.getBoundingClientRect();return r.width>=80&&r.height>=52&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})'),'Large mobile touch targets '+width);
   assert(await evaluate('(()=>{const a=document.querySelector(".discman-player").getBoundingClientRect(),b=document.querySelector(".notebook-inspector__viewport").getBoundingClientRect();return a.left>=b.right||a.right<=b.left||a.top>=b.bottom||a.bottom<=b.top})()'),'Mobile control panel does not overlap object '+width);
   assert(await evaluate('getComputedStyle(document.querySelector("[data-model-controls]")).display==="none"'),'No precision hotspots on mobile '+width);
  }
  assert(await evaluate('(()=>{const input=document.querySelector("[data-discman-volume]"),r=input.getBoundingClientRect(),output=document.querySelector("[data-discman-volume-value]");return r.height>=44&&r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&getComputedStyle(output).visibility==="visible"})()'),'Visible volume bar '+width);
  if(width===844){
   const touchControl=async action=>{const selector=({lid:'[data-discman-lid]',play:'[data-discman-toggle]',pause:'[data-discman-pause]',previous:'[data-discman-skip=previous]'})[action],p=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await page.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:0}]});await page.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
   await touchControl('lid');await until('document.querySelector("[data-discman-lid]").getAttribute("aria-expanded")==="false"&&document.querySelector("[data-discman-lid]").getAttribute("aria-busy")==="false"','mobile panel closes lid');
   await touchControl('lid');await until('document.querySelector("[data-discman-lid]").getAttribute("aria-expanded")==="true"&&document.querySelector("[data-discman-lid]").getAttribute("aria-busy")==="false"','mobile panel opens lid');
   await touchControl('play');await until('window.__discAudio.some(a=>!a.paused)','touch play');await touchControl('pause');await until('window.__discAudio.every(a=>a.paused)','touch pause');
   const title=await evaluate('document.querySelector("[data-discman-title]").textContent');await touchControl('previous');await until(`document.querySelector('[data-discman-title]').textContent!==${JSON.stringify(title)}`,'mobile panel changes track');
  }
  fs.writeFileSync(path.join(output,'discman-controls-'+width+'.png'),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 }
 await evaluate('document.querySelector("[data-notebook-close]").click()');await until('window.__discAudio.every(a=>a.paused)','close pauses audio');
 await until('window.__inspectionDraws.room>0','room rendering resumes after inspection');
 assert.equal(page.errors.length,0,JSON.stringify(page.errors));console.log('PASS: physical OPEN closes the lid, keyboard and mobile touch reopen it; visible markers, physical playback, volume wheel and bounded mobile/desktop zoom.');
}finally{page?.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.close();}else child?.kill();}

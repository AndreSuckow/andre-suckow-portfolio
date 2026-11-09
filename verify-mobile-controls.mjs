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
 await page.send('Page.addScriptToEvaluateOnNewDocument',{source:'try{localStorage.setItem("andre:prefs",JSON.stringify({...JSON.parse(localStorage.getItem("andre:prefs")||"{}"),mode:"2d"}))}catch{}'});
 const evaluate=async expression=>{const result=await page.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
 const until=async(expression,label)=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await wait(60);}throw Error(`Timed out: ${label}`);};



 await page.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
 await page.send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true});
 await page.send('Page.navigate',{url:base});
 await until('document.documentElement.dataset.mode==="3d"&&document.querySelector("[data-loader]").hidden','3D loaded');
 await evaluate('document.querySelector("[data-nav-tab=sobre]").click()');
 await until('document.documentElement.hasAttribute("data-mobile-reading")','mobile reading');
 await wait(1800);
 const tap=async selector=>{const p=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await page.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await page.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 for(const [width,height] of [[844,390],[667,375],[568,320]]){
  await page.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await wait(500);
  const bounds=await evaluate('Array.from(document.querySelectorAll(".snes-pad button")).map(b=>{const r=b.getBoundingClientRect();return {name:b.textContent,x:r.x,y:r.y,w:r.width,h:r.height}})');
  for(const b of bounds){assert(b.x>=0&&b.y>=0&&b.x+b.w<=width&&b.y+b.h<=height,'button fits: '+JSON.stringify(b));assert(b.w>=44&&b.h>=44,'touch target');}
  fs.writeFileSync(path.join(output,`controls-${width}.png`),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await tap('[data-controls-help]');await until('document.querySelector("#controls-help-dialog").open','help opens by touch');
  assert.equal(await evaluate('document.documentElement.dataset.paused'),'true');
  assert.equal(await evaluate('document.activeElement.hasAttribute("data-controls-close")'),true);
  assert(await evaluate('document.querySelector("#controls-help-dialog").getBoundingClientRect().bottom<=innerHeight'),'dialog fits');
  fs.writeFileSync(path.join(output,`controls-help-${width}.png`),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await evaluate('document.querySelector("#controls-help-dialog").scrollTop=10000');
  await tap('#controls-help-dialog footer [data-controls-close]');
  await until('!document.querySelector("#controls-help-dialog").open','footer closes by touch after scroll');
  await until('!document.documentElement.hasAttribute("data-paused")','footer resumes navigation');
  await tap('[data-controls-help]');await until('document.querySelector("#controls-help-dialog").open','help reopens');
  await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await until('!document.querySelector("#controls-help-dialog").open','Escape closes');
  await until('!document.documentElement.hasAttribute("data-paused")','Escape resumes navigation');
  assert.equal(await evaluate('document.documentElement.hasAttribute("data-paused")'),false);
  assert.equal(await evaluate('document.activeElement.hasAttribute("data-controls-help")'),true);
 }
 await evaluate('document.querySelector("[data-nav-tab=skills]").click()');await wait(1800);
 await tap('[data-pad=a]');await until('document.querySelector("#skill-dialog").open','purple selects skill');
 await evaluate('document.querySelector("[data-skill-close]").click()');
 await tap('[data-pad=b]');await until('document.documentElement.dataset.chapter==="projetos"','gray goes to previous section');
 await tap('[data-controls-help]');await until('document.querySelector("#controls-help-dialog").open','help again');
 await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await wait(300);
 assert.equal(await evaluate('document.querySelector(".mobile-reading").open'),true);
 await page.send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true});await wait(300);
 assert.equal(await evaluate('document.querySelector("#controls-help-dialog").open'),true);
 await evaluate('document.querySelector("#controls-help-dialog [data-controls-close]").click()');
 await until('!document.querySelector("dialog[open]")','close restores room after rotation');
 assert.equal(await evaluate('document.querySelector("dialog[open]")===null'),true);
 assert.equal(page.errors.length,0,JSON.stringify(page.errors));
 console.log('PASS: touch targets, selection, return, help, Escape, focus and rotation at 844/667/568px.');
}finally{page?.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.close();}else child?.kill();}

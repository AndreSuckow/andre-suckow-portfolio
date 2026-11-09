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
 const ws=new WebSocket(url),pending=new Map();let next=0;const errors=[],events=[];
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 ws.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const request=pending.get(message.id);if(request){clearTimeout(request.timeout);pending.delete(message.id);message.error?request.reject(Error(JSON.stringify(message.error))):request.resolve(message.result);}}else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);else if(message.method==='Fetch.requestPaused')events.push(message.params);});
 return {errors,events,send:(method,params={})=>new Promise((resolve,reject)=>{const id=++next,timeout=setTimeout(()=>{pending.delete(id);reject(Error(`Timeout: ${method}`));},30000);pending.set(id,{resolve,reject,timeout});ws.send(JSON.stringify({id,method,params}));}),close:()=>ws.close()};
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



 await page.send('Network.setCacheDisabled',{cacheDisabled:true});
 await page.send('Fetch.enable',{patterns:[{urlPattern:'*engine.js*',requestStage:'Request'}]});
 await page.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await page.send('Page.navigate',{url:base});
 for(let i=0;!page.events.length&&i<200;i++)await wait(50);
 assert(page.events.length,'Engine request paused for a slow-load scenario');
 await until('document.fonts.status==="loaded"&&document.documentElement.dataset.siteLoading==="true"','loader visible before engine');
 for(const [width,height] of [[1440,900],[390,844],[568,320]]){
  await page.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1000});await wait(100);
  const state=await evaluate('(()=>{const l=document.querySelector("[data-loader]"),r=l.querySelector(".site-loading__card").getBoundingClientRect();return {hidden:l.hidden,position:getComputedStyle(l).position,main:getComputedStyle(document.querySelector("main")).visibility,x:r.x+r.width/2,y:r.y+r.height/2,left:r.left,right:r.right,scroll:document.documentElement.scrollWidth}})()');
  assert.equal(state.hidden,false);assert.equal(state.position,'fixed');assert.equal(state.main,'hidden');
  assert(Math.abs(state.x-width/2)<1&&Math.abs(state.y-height/2)<1,'Loader card centered at '+width);
  assert(state.left>=19&&state.right<=width-19&&state.scroll<=width+1,'Card fits viewport without overflow');
  fs.writeFileSync(path.join(output,'loading-screen-'+width+'.png'),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 }
 await page.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 for(const request of page.events.splice(0))await page.send('Fetch.continueRequest',{requestId:request.requestId});
 await page.send('Fetch.disable');
 await until('document.querySelector("[data-loader]").hidden&&!document.documentElement.hasAttribute("data-site-loading")&&document.documentElement.dataset.roomVersion==="novo-quarto-3d"','scene revealed after real initialization');
 assert.equal(await evaluate('getComputedStyle(document.querySelector("main")).visibility'),'visible');
 assert.equal(await evaluate('document.querySelector("[data-loader-pct]").textContent'),'100%');
 fs.writeFileSync(path.join(output,'loading-screen-ready.png'),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await page.send('Fetch.enable',{patterns:[{urlPattern:'*engine.js*',requestStage:'Request'}]});
 await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await page.send('Page.navigate',{url:base});
 for(let i=0;!page.events.length&&i<200;i++)await wait(50);
 assert(page.events.length,'Engine intercepted for failure scenario');
 for(const request of page.events.splice(0))await page.send('Fetch.failRequest',{requestId:request.requestId,errorReason:'Failed'});
 await page.send('Fetch.disable');
 await until('document.documentElement.dataset.mode==="2d"&&document.querySelector("[data-loader]").hidden&&!document.documentElement.hasAttribute("data-site-loading")','2D fallback after failed 3D download');
 assert.equal(await evaluate('getComputedStyle(document.querySelector("main")).visibility'),'visible');
 assert.equal(page.errors.length,0,JSON.stringify(page.errors));console.log('PASS: centered initial loader at desktop/mobile sizes, hidden background, real 3D reveal and 2D recovery with reduced motion.');
}finally{page?.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.close();}else child?.kill();}

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
 await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.gbAudio=[];const NativeAudio=window.AudioContext;window.AudioContext=class extends NativeAudio{constructor(...args){super(...args);window.gbAudio.push(this);this.peak=0;this.callbacks=0;}createScriptProcessor(...args){const node=super.createScriptProcessor(...args);Object.defineProperty(node,'onaudioprocess',{set:handler=>node.addEventListener('audioprocess',event=>{handler(event);this.callbacks++;const data=event.outputBuffer.getChannelData(0);for(const sample of data)if(Number.isFinite(sample))this.peak=Math.max(this.peak,Math.abs(sample));})});return node;}};`});
 await page.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await page.send('Page.navigate',{url:base});
 await until('document.querySelector("[data-room-gameboy]")','room access');
 await until('document.querySelector("[data-loader]").hidden','loader ready');
 await evaluate(`(async()=>{document.querySelectorAll("dialog[open]").forEach(d=>d.close());const m=await import(new URL("gameboy.js",document.querySelector('link[href*="gameboy.css"]').href));m.openGameBoy();})()`);
 await until('document.querySelector("#gameboy-dialog")?.open','Game Boy opens');
 const click=async selector=>{await evaluate('document.querySelector('+JSON.stringify(selector)+').scrollIntoView({block:"center",behavior:"instant"})');await wait(250);const r=await evaluate('(()=>{const r=document.querySelector('+JSON.stringify(selector)+').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');await page.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...r});await page.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...r});};
 await click('[data-gb-blue]');
 await until('document.querySelector("[data-gb-led]").dataset.on==="true"','game starts');
 await until('window.gbAudio.some(a=>a.state==="running"&&a.peak>.001)','real audio samples');
 console.log('Audio:',await evaluate('gbAudio.map(a=>({state:a.state,rate:a.sampleRate,peak:a.peak,callbacks:a.callbacks}))'));
 for(const [width,height] of [[1440,1000],[1920,1080],[390,844],[320,740],[844,390]]){
  await page.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900});
  await evaluate('document.querySelector("#gameboy-dialog").scrollTop=0');await wait(150);
  const result=await evaluate('(()=>{const d=document.querySelector("#gameboy-dialog"),r=d.getBoundingClientRect(),device=document.querySelector(".gb-device").getBoundingClientRect();return {center:r.x+r.width/2,width:innerWidth,top:r.top,bottom:r.bottom,overflow:d.scrollWidth>d.clientWidth,buttons:[...document.querySelectorAll(".gb-dpad button")].map(b=>{const q=b.getBoundingClientRect();return {x:q.x,y:q.y,w:q.width,h:q.height}}),device:{left:device.left,right:device.right}}})()');
  assert(Math.abs(result.center-result.width/2)<=1,'centered '+width);assert(!result.overflow,'no horizontal overflow '+width);assert(result.top>=0&&result.bottom<=height+1,'viewport bound');
  for(const b of result.buttons){assert.equal(b.w,44);assert.equal(b.h,44);assert(b.x>=result.device.left&&b.x+b.w<=result.device.right,'direction fits');}
  assert.equal(result.buttons[0].x,result.buttons[3].x,'Up/Down aligned');assert.equal(result.buttons[1].y,result.buttons[2].y,'Left/Right aligned');
  fs.writeFileSync(path.join(output,'gameboy-'+width+'.png'),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  if(width===390){
   await page.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
   for(const action of ['Down','A']){
    const selector='[data-gb-action="'+action+'"]';await evaluate('document.querySelector('+JSON.stringify(selector)+').scrollIntoView({block:"center",behavior:"instant"})');await wait(100);
    const p=await evaluate('(()=>{const r=document.querySelector('+JSON.stringify(selector)+').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
    await page.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});
    assert.equal(await evaluate('document.querySelector('+JSON.stringify(selector)+').dataset.pressed'),'true','touch holds '+action);
    await page.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await evaluate('document.querySelector('+JSON.stringify(selector)+').dataset.pressed'),undefined,'touch releases '+action);
   }
   await page.send('Emulation.setTouchEmulationEnabled',{enabled:false});
  }
 }
 await click('[data-gb-pause]');await until('gbAudio.at(-1).state==="suspended"','pause suspends audio');
 await click('[data-gb-pause]');await until('gbAudio.at(-1).state==="running"','resume restores audio');
 await click('[data-gb-mute]');assert.equal(await evaluate('document.querySelector("[data-gb-mute]").getAttribute("aria-pressed")'),'true');
 await click('[data-gb-mute]');
 await click('[data-gb-close]');await until('gbAudio.at(-1).state==="closed"','close releases audio');
 assert.equal(page.errors.length,0,JSON.stringify(page.errors));
 console.log('PASS: centered desktop/mobile, matching 44px directions, real game audio, pause/resume/mute/close.');
}finally{page?.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.close();}else child?.kill();}

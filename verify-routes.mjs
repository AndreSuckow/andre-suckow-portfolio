// Optional real-browser gameplay check using an isolated headless Chrome profile.
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import os from 'node:os';
const executable=process.env.GAME_TEST_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base=process.env.GAME_TEST_URL||'http://127.0.0.1:4173/';
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
 const evaluate=async expression=>{const result=await page.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
 const until=async(expression,label)=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await wait(60);}throw Error(`Timed out: ${label}`);};
 const cs=new URL('cs/',base),homePath=new URL(base).pathname;
 for(const [width,height] of [[1440,1000],[390,844]]){
  await page.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
  await page.send('Page.navigate',{url:base});await until('document.readyState==="complete" && document.querySelector(".resume-home__content")','curriculum home');
  await evaluate('document.fonts.ready');
  const home=await evaluate('({path:location.pathname,game:!!document.querySelector("#stage-canvas"),scripts:document.scripts.length,overflow:document.documentElement.scrollWidth>innerWidth,link:document.querySelector(".resume-home a").href,height:document.querySelector(".resume-home a").getBoundingClientRect().height})');
  assert.equal(home.path,homePath);assert.equal(home.game,false);assert.equal(home.scripts,0);assert.equal(home.overflow,false);assert.equal(home.link,cs.href);assert(home.height>=44);
  await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  assert.equal(await evaluate('document.activeElement.tagName'),'A','home link is keyboard reachable');
  await evaluate('document.fonts.ready');
  fs.writeFileSync(path.join(output,'routes-home-'+width+'.png'),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 }
 await page.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await evaluate('document.querySelector(".resume-home a").click()');
 await until('document.querySelector("#stage-canvas") && document.querySelector("[data-loader]").hidden','CS portfolio through home link');
 assert.equal(await evaluate('location.pathname'),cs.pathname);
 await page.send('Page.reload');await until('document.querySelector("#stage-canvas") && document.querySelector("[data-loader]").hidden','direct CS refresh');
 await page.send('Page.navigate',{url:new URL('cs',base).href});
 await until(`location.pathname===${JSON.stringify(cs.pathname)} && document.querySelector("[data-loader]")?.hidden`,'CS without trailing slash');
 fs.writeFileSync(path.join(output,'routes-cs.png'),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 const details=await evaluate(`(async()=>{const response=await fetch(${JSON.stringify(new URL('curriculo/',base).href)});const html=await response.text();const document=new DOMParser().parseFromString(html,'text/html');return {status:response.status,back:document.querySelector('.document-actions a').getAttribute('href')};})()`);
 assert.equal(details.status,200);assert.equal(details.back,cs.pathname);
 assert.equal(page.errors.length,0,JSON.stringify(page.errors));
 console.log('PASS: separate curriculum home, desktop/mobile, keyboard link, CS entry, refresh, /cs redirect and printable CV return link.');
}finally{page?.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.close();}else child?.kill();}

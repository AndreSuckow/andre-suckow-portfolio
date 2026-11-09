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

 const cs=new URL('cs/',base);
 const signatures=[];
 await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const [route,kind] of [[base,'curriculo'],[cs.href,'cs']]){
  await page.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await page.send('Page.navigate',{url:route});
  await until('document.querySelector("#stage-canvas") && document.querySelector("[data-loader]")?.hidden','portfolio '+kind);
  const signature=await evaluate('({kind:document.documentElement.dataset.portfolio,styles:[...document.querySelectorAll("link[rel=stylesheet]")].map(e=>e.href),chapters:[...document.querySelectorAll("section[data-chapter]")].map(e=>({id:e.id,class:e.className})),scripts:[...document.querySelectorAll("script[src]")].map(e=>e.src),placeholder:!!document.querySelector(".resume-home__content")})');
  assert.equal(signature.kind,kind);assert.equal(signature.placeholder,false);delete signature.kind;signatures.push(signature);
  await evaluate('document.querySelector("[data-nav-tab=experiencia]").click()');await until('document.documentElement.dataset.chapter==="experiencia"','experience '+kind);
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  fs.writeFileSync(path.join(output,'routes-'+kind+'-desktop.png'),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await evaluate('document.querySelector("[data-toggle=mode]").click()');await until('document.documentElement.dataset.mode==="2d"','2D '+kind);
  await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await wait(150);
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false,'mobile fits '+kind);
  fs.writeFileSync(path.join(output,'routes-'+kind+'-mobile.png'),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  for(const detail of ['curriculo/','cases/onboarding/']){
   const details=await evaluate('(async()=>{const r=await fetch('+JSON.stringify(new URL(detail,route).href)+');const d=new DOMParser().parseFromString(await r.text(),"text/html");return {status:r.status,back:d.querySelector(".document-actions a").getAttribute("href")};})()');
   assert.equal(details.status,200);assert.equal(details.back,new URL(route).pathname,'detail returns to '+kind);
  }
  await page.send('Page.reload');await until('document.querySelector("#stage-canvas") && document.querySelector("[data-loader]")?.hidden','direct reload '+kind);
  console.log('PASS:',kind,'shared 3D/2D layout, mobile, details and direct reload');
 }
 assert.deepEqual(signatures[0],signatures[1],'root and CS load the same presentation and runtime');
 await page.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await page.send('Page.navigate',{url:new URL('cs',base).href});
 await until('location.pathname==='+JSON.stringify(cs.pathname)+' && document.querySelector("[data-loader]")?.hidden','CS without trailing slash');
 assert.equal(page.errors.length,0,JSON.stringify(page.errors));
 console.log('PASS: identical presentation at root and /cs/, independent route identity, responsive layout and route-specific document return links.');
}finally{page?.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.close();}else child?.kill();}

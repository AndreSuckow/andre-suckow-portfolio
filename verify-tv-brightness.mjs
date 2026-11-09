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
let onEvent;
async function connect(url){
 const ws=new WebSocket(url),pending=new Map();let next=0;const errors=[];
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 ws.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.method==='Fetch.requestPaused')onEvent?.(message.params);if(message.id){const request=pending.get(message.id);if(request){clearTimeout(request.timeout);pending.delete(message.id);message.error?request.reject(Error(JSON.stringify(message.error))):request.resolve(message.result);}}else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);});
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
 // Diagnostic handles are injected only into this isolated browser response.
 // The published engine has no test hook or forced graphics settings.
 onEvent=async({requestId})=>{
  try{
   const body=await page.send('Fetch.getResponseBody',{requestId});let code=body.base64Encoded?Buffer.from(body.body,'base64').toString('utf8'):body.body;
   const marker='return fe(),D.update(0,D.frame(';
   assert(code.includes(marker),'engine diagnostic injection point');
   code=code.replace(marker,'window.tvBrightness={tv:b,game:g,quality:de,post:E,renderer:l,rig:D,nav:O,carts:w,insert:I,eject:L,powerOff:ee,powerOn:F};'+marker);
   await page.send('Fetch.fulfillRequest',{requestId,responseCode:200,body:Buffer.from(code).toString('base64'),responseHeaders:[{name:'Content-Type',value:'text/javascript'}]});
  }catch(error){console.error(error);await page.send('Fetch.failRequest',{requestId,errorReason:'Failed'}).catch(()=>{});}
 };
 await page.send('Fetch.enable',{patterns:[{urlPattern:'*engine.js*',requestStage:'Response'}]});
 await page.send('Emulation.setDeviceMetricsOverride',{width:1000,height:800,deviceScaleFactor:1,mobile:false});
 await page.send('Page.navigate',{url:base});await until('window.tvBrightness && document.querySelector("[data-loader]").hidden','instrumented production engine');
 await evaluate(`(()=>{
  const d=tvBrightness;d.quality.tick=()=>{};
  const update=d.tv.update.bind(d.tv),draw=d.game.update.bind(d.game),camera=d.rig.update.bind(d.rig);
  d.tv.update=time=>update(d.sampling?2:time);
  d.game.update=delta=>draw(d.sampling?0:delta);
  d.rig.update=(delta,pose,snap)=>camera(d.sampling?0:delta,d.sampling?d.rig.views.screen:pose,d.sampling||snap);
 })()`);
 const settle=()=>evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
 const menu=async tab=>{await evaluate(`document.querySelector('[data-nav-tab="${tab}"]').click()`);await until(`tvBrightness.game.tab==='${tab}' && document.documentElement.dataset.chapter==='${tab}'`,'menu '+tab);await settle();};
 const key=async value=>{await evaluate('document.getElementById("stage-canvas").focus()');for(const type of ['keyDown','keyUp'])await page.send('Input.dispatchKeyEvent',{type,key:value,code:value,windowsVirtualKeyCode:value==='ArrowRight'?39:37});};
 const tier=async value=>{await evaluate(`tvBrightness.quality.tier=${JSON.stringify(value)};tvBrightness.quality.onChange(${JSON.stringify(value)})`);await settle();};
 const sharp=(await import('sharp')).default;
 async function sample(label){
  await evaluate('tvBrightness.sampling=true;tvBrightness.game.time=2;tvBrightness.game.invalidate()');await settle();
  const png=Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64');fs.writeFileSync(path.join(output,'brightness-'+label+'.png'),png);
  const {data,info}=await sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const box={x:Math.round(info.width*.35),y:Math.round(info.height*.18),w:Math.round(info.width*.3),h:Math.round(info.height*.02)};
  let luminance=0,variation=0,count=0;
  for(let y=box.y;y<box.y+box.h;y++)for(let x=box.x;x<box.x+box.w-1;x++){
   const i=(y*info.width+x)*info.channels;let value=0,next=0;
   for(let c=0;c<3;c++){value+=data[i+c]/3;next+=data[i+info.channels+c]/3;}
   luminance+=value;variation+=Math.abs(value-next);count++;
  }
  const state=await evaluate('({quality:tvBrightness.quality.tier,composer:!!tvBrightness.post.composer,noise:tvBrightness.tv.crt.u.uNoise.value,power:tvBrightness.tv.crt.u.uPower.value,crt:tvBrightness.tv.crt.u.uIntensity.value})');
  await evaluate('tvBrightness.sampling=false');
  const result={label,brightness:luminance/count,grain:variation/count,...state};console.log(JSON.stringify(result));return result;
 }
 const compare=(before,after)=>{
  const brightness=after.brightness/before.brightness,grain=after.grain/before.grain;
  assert(brightness>.85&&brightness<1.15,`brightness changed: ${JSON.stringify({before,after})}`);
  assert(grain>.75&&grain<1.25,`grain changed: ${JSON.stringify({before,after})}`);
  assert.equal(after.crt,1);assert.equal(after.power,1);assert.equal(after.noise,0,'measure persistent effect after the burst');
 };
 await menu('experiencia');await tier('medium');const reference=await sample('reference-medium');
 await menu('projetos');await tier('low');await menu('experiencia');compare(reference,await sample('menu-projects-low-return'));
 await tier('medium');await key('ArrowRight');await until('tvBrightness.game.tab==="projetos"','keyboard to Projects');await tier('low');await key('ArrowLeft');await until('tvBrightness.game.tab==="experiencia"','keyboard return');compare(reference,await sample('keyboard-projects-low-return'));
 await tier('medium');
 await evaluate('tvBrightness.game.activate(tvBrightness.game.items.find(item=>item.id==="tab/projetos"))');await until('tvBrightness.game.tab==="projetos"','TV menu to Projects');await tier('low');
 await evaluate('tvBrightness.game.activate(tvBrightness.game.items.find(item=>item.id==="tab/experiencia"))');await until('tvBrightness.game.tab==="experiencia"','TV menu return');compare(reference,await sample('tv-menu-projects-low-return'));
 await tier('high');compare(reference,await sample('high'));
 // Run the actual insertion, replacement, ejection and power routines. Sample
 // only after their temporary bursts have fully expired.
 for(const slug of ['onboarding','implantacao']){
  await menu('projetos');await evaluate(`tvBrightness.insert(${JSON.stringify(slug)})`);
  await until(`tvBrightness.carts.inserted?.slug===${JSON.stringify(slug)} && !tvBrightness.carts.busy`,'cartridge '+slug);
  await menu('experiencia');await tier('low');await until('tvBrightness.tv.crt.u.uNoise.value===0','loading static expired');compare(reference,await sample('cartridge-'+slug+'-return'));
 }
 await evaluate('tvBrightness.eject()');await until('!tvBrightness.carts.inserted','ejected');await menu('experiencia');await until('tvBrightness.tv.crt.u.uNoise.value===0','ejection static expired');compare(reference,await sample('ejected-return'));
 await evaluate('tvBrightness.powerOff()');await until('tvBrightness.tv.crt.u.uPower.value===0','powered off');
 await evaluate('tvBrightness.powerOn(true)');await menu('experiencia');await until('tvBrightness.tv.crt.u.uPower.value===1 && tvBrightness.tv.crt.u.uNoise.value===0','powered back on');compare(reference,await sample('power-cycle-return'));
 const clock=await evaluate('tvBrightness.tv.crt.u.uTime.value');await wait(200);await until('tvBrightness.tv.crt.u.uTime.value>'+clock,'grain animation continues');
 for(const tab of ['skills','hobbies']){await menu(tab);assert.equal(await evaluate('tvBrightness.tv.crt.u.uIntensity.value'),1);}
 assert.equal(page.errors.length,0,JSON.stringify(page.errors));
 console.log('PASS: measured brightness/grain survive Projects via external menu/TV menu/keyboard, insertion/replacement/ejection, power cycle and high/medium/low graphics.');
}finally{page?.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.close();}else child?.kill();}

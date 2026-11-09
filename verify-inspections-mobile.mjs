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
 


 const bounds=()=>evaluate('(()=>{const c=document.querySelector("[data-notebook-canvas]"),r=c.getBoundingClientRect(),copy=document.createElement("canvas");copy.width=c.width;copy.height=c.height;const ctx=copy.getContext("2d");ctx.drawImage(c,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;let left=c.width,top=c.height,right=0,bottom=0;for(let y=0;y<c.height;y+=2)for(let x=0;x<c.width;x+=2)if(d[(y*c.width+x)*4+3]>40){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}const a=document.querySelector(".notebook-inspector__actions").getBoundingClientRect();return {object:{left:r.left+left/c.width*r.width,right:r.left+right/c.width*r.width,top:r.top+top/c.height*r.height,bottom:r.top+bottom/c.height*r.height},actions:{left:a.left,right:a.right,top:a.top,bottom:a.bottom},canvas:{width:r.width,height:r.height},viewport:{width:innerWidth,height:innerHeight},scrollWidth:document.querySelector("#games-notebook").scrollWidth}})()');
 const results=[];
 await page.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
 await page.send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true});
 await page.send('Page.navigate',{url:base});
 await until('document.documentElement.dataset.mode==="3d"&&document.querySelector("[data-loader]").hidden&&document.documentElement.dataset.roomVersion==="novo-quarto-3d"','3D room ready');
 for(const [width,height] of (process.env.INSPECTION_ROTATION_ONLY ? [[844,390]] : [[844,390],[667,375],[568,320]])){
  await page.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
  for(const kind of ['notebook','bible','pokedex','family','discman']){
   await evaluate(kind==='notebook'?'document.querySelector("[data-room-notebook]").click()':'document.querySelector("[data-room-inspect='+kind+']").click()');
   await until('document.querySelector("#games-notebook").open&&document.querySelector("[data-notebook-canvas]").dataset.ready==="true"','inspection ready: '+kind);
   await until('document.querySelector("[data-notebook-canvas]").getAnimations().every(a=>a.playState==="finished")','pickup animation completes');await wait(150);const layout=await bounds();results.push({width,height,kind,...layout});console.log(JSON.stringify(results.at(-1)));
   fs.writeFileSync(path.join(output,'inspect-mobile-'+width+'-'+kind+'.png'),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
   const {object,actions}=layout;
   assert(object.left>4&&object.top>4&&object.right<width-4&&object.bottom<height-4,'Object fits viewport: '+kind+' '+width);
   assert(actions.left>=0&&actions.top>=0&&actions.right<=width+.5&&actions.bottom<=height+.5,'Actions fit viewport: '+kind+' '+width);
   assert(layout.scrollWidth<=width+1,'Inspection has no horizontal overflow');
   const buttonPosition=await evaluate('(()=>{const r=document.querySelector("[data-notebook-view=in]").getBoundingClientRect();return {x:r.x,y:r.y}})()');
   for(const direction of ['in','out']){
    await evaluate(`(()=>{const b=document.querySelector('[data-notebook-view=${direction}]');for(let i=0;i<12;i++)b.click()})()`);await wait(100);
    assert(await evaluate(`document.querySelector('[data-notebook-view=${direction}]').disabled`),'Zoom stops at '+direction);
    const limited=await bounds(),p=await evaluate('(()=>{const r=document.querySelector("[data-notebook-view=in]").getBoundingClientRect();return {x:r.x,y:r.y}})()');
    assert.deepEqual(p,buttonPosition,'Zoom controls stay fixed: '+kind+' '+width);
    assert(limited.object.left>=23&&limited.object.top>=23&&limited.object.right<=limited.actions.left-23&&limited.object.bottom<=height-23,'Zoom stays inside reserved area: '+kind+' '+width);
    if(direction==='in')fs.writeFileSync(path.join(output,'inspect-zoom-max-'+width+'-'+kind+'.png'),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
   }
   await evaluate('document.querySelector("[data-notebook-canvas]").dispatchEvent(new KeyboardEvent("keydown",{key:"Home",bubbles:true}))');await wait(100);
   const point={x:(object.left+object.right)/2,y:(object.top+object.bottom)/2};const before=await evaluate('document.querySelector("[data-notebook-canvas]").toDataURL()');
   await page.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]});await page.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x+60,y:point.y+16,id:1}]});await page.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(100);
   assert.notEqual(await evaluate('document.querySelector("[data-notebook-canvas]").toDataURL()'),before,'Touch rotates '+kind);const rotated=await bounds();assert(rotated.object.left>4&&rotated.object.top>4&&rotated.object.right<width-4&&rotated.object.bottom<height-4,'Rotated object fits: '+kind+' '+width);
   assert.deepEqual(rotated.actions,layout.actions,'Rotation leaves controls fixed');
   if(width===844){
    await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await until('innerWidth===390&&Math.abs(document.querySelector("[data-notebook-canvas]").width-document.querySelector("[data-notebook-canvas]").getBoundingClientRect().width)<1.1','portrait resize');
    await page.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
    await until('innerWidth===844&&Math.abs(document.querySelector("[data-notebook-canvas]").width-document.querySelector("[data-notebook-canvas]").getBoundingClientRect().width)<1.1','landscape resize');
    await wait(100);const restored=await bounds();assert(restored.actions.right<=width+.5&&restored.actions.bottom<=height+.5,'Actions return after orientation change');
    assert(restored.object.left>4&&restored.object.top>4&&restored.object.right<width-4&&restored.object.bottom<height-4,'Object returns after orientation change');
   }
   await evaluate('document.querySelector("[data-notebook-close]").click()');await until('!document.querySelector("#games-notebook").open&&document.body.style.overflow!=="hidden"','close restores room');await wait(500);
  }
 }
 assert.equal(page.errors.length,0,JSON.stringify(page.errors));fs.writeFileSync(path.join(output,'inspection-mobile-verification.json'),JSON.stringify(results,null,2));console.log('PASS: five 3D inspections across three landscape sizes, touch rotation and return.');
}finally{page?.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.close();}else child?.kill();}

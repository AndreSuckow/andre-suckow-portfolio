// Optional real-browser gameplay check using an isolated headless Chrome profile.
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import os from 'node:os';
const executable=process.env.GAME_TEST_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base=process.env.GAME_TEST_URL||'http://127.0.0.1:4180/cs/';
const output=path.resolve('tmp/contact-browser');fs.mkdirSync(output,{recursive:true});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function connect(url){
 const ws=new WebSocket(url),pending=new Map();let next=0;const errors=[];
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 ws.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const request=pending.get(message.id);if(request){clearTimeout(request.timeout);pending.delete(message.id);message.error?request.reject(Error(JSON.stringify(message.error))):request.resolve(message.result);}}else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);});
 return {errors,send:(method,params={})=>new Promise((resolve,reject)=>{const id=++next,timeout=setTimeout(()=>{pending.delete(id);reject(Error(`Timeout: ${method}`));},12000);pending.set(id,{resolve,reject,timeout});ws.send(JSON.stringify({id,method,params}));}),close:()=>ws.close()};
}
let browser,page,child;
const contactServer=spawn(process.execPath,['server.mjs','--port','4180'],{windowsHide:true,stdio:'ignore'});
try{
 for(let i=0;i<30;i++){try{if((await fetch(base)).ok)break;}catch{}await wait(100);}
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
 await page.send('Page.enable');await page.send('Runtime.enable');
 const evaluate=async expression=>{const result=await page.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
 const until=async(expression,label)=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await wait(60);}throw Error(`Timed out: ${label}`);};
 const key=async(value,type='keyDown')=>{const codes={ArrowRight:'ArrowRight',Enter:'Enter',e:'KeyE'};await page.send('Input.dispatchKeyEvent',{type,key:value,code:codes[value]||value,windowsVirtualKeyCode:value==='Enter'?13:value==='ArrowRight'?39:69});};


 await page.send('Emulation.setDeviceMetricsOverride',{width:800,height:1000,deviceScaleFactor:1,mobile:false});
 await page.send('Page.navigate',{url:base});
 await until('document.querySelector("#contact-dialog form")?.getAttribute("action")==="https://formsubmit.co/andre.suckow.dev@gmail.com"','real email form');
 await until('document.readyState==="complete"','contact controller loaded');
 await evaluate('document.querySelector("[data-action=open-contact]").click()');
 await until('document.querySelector("#contact-dialog").open','contact modal opens');
 // Browser fixture exercises the UI contract without sending a real message.
 await evaluate(`window.contactFetch=window.fetch;window.fetch=async (url,options)=>{if(url==='https://formsubmit.co/ajax/andre.suckow.dev@gmail.com'){if(!options?.method)return new Response(JSON.stringify({ready:true}),{status:200,headers:{'Content-Type':'application/json'}});window.contactRequests=(window.contactRequests||0)+1;return new Response(JSON.stringify(window.contactFail?{error:'Serviço indisponível. Tente novamente.'}:{success:'true'}),{status:window.contactFail?502:200,headers:{'Content-Type':'application/json'}});}return window.contactFetch(url,options);};window.contactFail=true;`);
 await evaluate('document.querySelector("[data-action=open-contact]").click()');
 await until('!document.querySelector("#contact-dialog [type=submit]").disabled','fixture ready');
 await evaluate('document.querySelector("#contact-dialog form").requestSubmit()');
 assert.equal(await evaluate('document.activeElement.name'),'name');
 await evaluate(`document.querySelector('#contact-name').value='Pessoa de teste';document.querySelector('#contact-email').value='fixture@example.com';document.querySelector('#contact-message').value='Temos uma oportunidade para você.';document.querySelector('#contact-dialog form').requestSubmit();`);
 await until('document.querySelector("#contact-dialog .dialog__status").hasAttribute("data-error")','provider failure');
 assert.equal(await evaluate('document.querySelector("#contact-message").value'),'Temos uma oportunidade para você.');
 fs.writeFileSync(path.join(output,'failure.png'),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await evaluate('window.contactFail=false;document.querySelector("#contact-dialog form").requestSubmit()');
 await until('document.querySelector("#contact-dialog .dialog__status").textContent.includes("Mensagem recebida")','accepted fixture');
 assert.equal(await evaluate('window.contactRequests'),2);assert.equal(await evaluate('document.querySelector("#contact-message").value'),'');
 fs.writeFileSync(path.join(output,'success-fixture.png'),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await wait(200);
 fs.writeFileSync(path.join(output,'mobile.png'),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 assert(await evaluate('document.querySelector("#contact-dialog").getBoundingClientRect().right<=innerWidth'));
 assert.equal(page.errors.length,0,JSON.stringify(page.errors));
 fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify({realEmailSent:false,provider:'mocked browser fixture',checks:['inline validation','provider failure preserves draft','confirmed acceptance clears form','mobile modal'],exceptions:page.errors},null,2));
 console.log('PASS: contact UI, validation, failure/retry and mobile. Provider mocked; no real email sent.');
}finally{contactServer.kill();page?.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.close();}else child?.kill();}

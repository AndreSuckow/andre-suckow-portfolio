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
 await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`
  window.crtPrograms=[];
  for(const Type of [window.WebGLRenderingContext,window.WebGL2RenderingContext]){
   const states=new WeakMap(),locations=new WeakMap(),p=Type.prototype,get=p.getUniformLocation,set=p.uniform1f;
   p.getUniformLocation=function(program,name){const location=get.call(this,program,name);if(location){let state=states.get(program);if(!state){state={u:{},frames:0,canvas:this.canvas.id};states.set(program,state);window.crtPrograms.push(state);}locations.set(location,{state,name});}return location;};
   p.uniform1f=function(location,value){const item=location&&locations.get(location);if(item){item.state.u[item.name]=value;if(item.name==='uTime'){item.state.frames++;if(this.canvas.id==='stage-canvas')window.activeCRT=item.state;}}return set.call(this,location,value);};
  }
 `});
 await page.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await page.send('Page.navigate',{url:base});
 await until('document.querySelector("[data-loader]")?.hidden','page loaded');
 const state='window.activeCRT';
 await until(`${state}?.u.uTime!==undefined`,'TV uniforms');
 for(let pass=0;pass<2;pass++)for(const tab of ['sobre','experiencia','projetos','skills','hobbies','contato']){
  await evaluate(`document.querySelector('[data-nav-tab="${tab}"]').click()`);
  await until(`document.documentElement.dataset.chapter==='${tab}'`,'chapter '+tab);
  const before=await evaluate(`${state}.u.uTime`);await wait(350);
  await until(`${state}.u.uTime>${before}`,'animation continues in '+tab);
  await until(`${state}.u.uPower===1`,'TV warmup complete in '+tab);
  const current=await evaluate(state);assert.equal(current.u.uIntensity,1,'CRT stays enabled in '+tab);assert.equal(current.u.uMotion,1);assert.equal(current.u.uPower,1);
  console.log('PASS navigation:',pass+1,tab,'quality',current.u.uLevel,'time',current.u.uTime.toFixed(2));
  if(pass===1)fs.writeFileSync(path.join(output,'crt-'+tab+'.png'),Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 }
 await evaluate('document.querySelector("[data-toggle=crt]").click()');await until(`${state}.u.uIntensity<.001`,'CRT off');
 await evaluate('document.querySelector("[data-toggle=crt]").click()');await until(`${state}.u.uIntensity>.999`,'CRT back on');
 // Compile the production TV shader on the real WebGL driver and sample its
 // output over full cycles at both quality levels, independent of scene FPS.
 const source=fs.readFileSync('src/engine.js','utf8');
 const fragment=source.slice(source.indexOf('precision highp float;',source.indexOf('`,_v=`')),source.indexOf('`,vv=class'));
 const gpu=await evaluate(`(${verifyShader.toString()})(${JSON.stringify(fragment)})`);
 assert(gpu.minimumBandContrast>2.5,JSON.stringify(gpu));assert(gpu.grainRms>1,JSON.stringify(gpu));assert(gpu.crtOffStable&&gpu.reducedMotionStable,JSON.stringify(gpu));
 console.log('PASS production shader on WebGL:',JSON.stringify(gpu));
 await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await until(`${state}.u.uIntensity===0`,'existing mobile CRT exception');
 await page.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await until(`${state}.u.uIntensity===1`,'desktop preference restored');
 assert.equal(page.errors.length,0,JSON.stringify(page.errors));
 console.log('PASS: two complete navigation rounds, CRT toggle, mobile/desktop, continuous rolling band, persistent grain and reduced motion.');
}finally{page?.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.close();}else child?.kill();}

function verifyShader(fragment){
 // This signal probe runs in linear space. The end-to-end brightness check
 // exercises Three's real colorspace chunk and the composer bypass together.
 fragment=fragment.replace('#include <colorspace_fragment>','');
 const size=128,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
 const gl=canvas.getContext('webgl',{preserveDrawingBuffer:true});if(!gl)throw Error('WebGL unavailable');
 gl.getExtension('OES_standard_derivatives');
 const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
 const program=gl.createProgram();
 gl.attachShader(program,compile(gl.VERTEX_SHADER,'precision highp float;attribute vec2 pos;varying vec2 vUv;varying vec3 vViewPos;varying vec3 vNormal;void main(){vUv=pos*.5+.5;vViewPos=vec3(0.,0.,-1.);vNormal=vec3(0.,0.,1.);gl_Position=vec4(pos,0.,1.);}'));
 gl.attachShader(program,compile(gl.FRAGMENT_SHADER,'#extension GL_OES_standard_derivatives : enable\n'+fragment));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const position=gl.getAttribLocation(program,'pos');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([38,51,76,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const set=(key,value)=>gl.uniform1f(gl.getUniformLocation(program,key),value);
 gl.uniform1i(gl.getUniformLocation(program,'uMap'),0);gl.uniform2f(gl.getUniformLocation(program,'uTexSize'),1024,768);
 set('uPower',1);set('uCurvature',0);set('uNoise',0);set('uBrightness',1.12);gl.viewport(0,0,size,size);
 const render=(time,motion=1,intensity=1)=>{set('uTime',time);set('uMotion',motion);set('uIntensity',intensity);gl.drawArrays(gl.TRIANGLES,0,6);const pixels=new Uint8Array(size*size*4);gl.readPixels(0,0,size,size,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;};
 const rowMeans=pixels=>Array.from({length:size},(_,y)=>{let sum=0;for(let x=0;x<size;x++)for(let c=0;c<3;c++)sum+=pixels[(y*size+x)*4+c];return sum/(size*3);});
 let minimumBandContrast=Infinity,frames=0;
 for(const level of [1,2]){
  set('uLevel',level);const baseline=rowMeans(render(0,0));
  for(let frame=0;frame<80;frame++){
   const means=rowMeans(render(frame/80/.12)),delta=means.map((v,i)=>v-baseline[i]);
   minimumBandContrast=Math.min(minimumBandContrast,Math.max(...delta)-Math.min(...delta));frames++;
  }
 }
 const first=render(0),next=render(1/.12);let total=0;
 // Subtract neighboring differences to reject uniform flicker and the band.
 for(let y=16;y<size-16;y++)for(let x=16;x<size-17;x++){const i=(y*size+x)*4,d=(first[i]-next[i])-(first[i+4]-next[i+4]);total+=d*d;}
 const grainRms=Math.sqrt(total/((size-32)*(size-33)));
 const equal=(a,b)=>a.every((v,i)=>v===b[i]);
 const crtOffStable=equal(render(0,1,0),render(5,1,0));
 const reducedMotionStable=equal(render(0,0),render(5,0));
 const error=gl.getError();if(error!==gl.NO_ERROR)throw Error('WebGL error '+error);
 gl.deleteBuffer(buffer);gl.deleteTexture(texture);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();
 return {frames,minimumBandContrast,grainRms,crtOffStable,reducedMotionStable};
}

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const source=fs.readFileSync('src/engine.js','utf8');
test('mobile disables CRT despite a saved preference and restores the desktop choice after resizing',()=>{
 for(const saved of [true,false]){
  const dom=new JSDOM('<button data-toggle="sound"></button><button data-toggle="crt"></button>');
  const media={matches:true,addEventListener(type,listener){this.listener=listener;}};
  const M={crt:saved,crtTarget:+saved},b={crt:{u:{uIntensity:{value:+saved}}}},writes=[];
  const start=source.indexOf('let se=i(`[data-toggle="sound"]`)'),end=source.indexOf('let B={chapter:',start);
  assert(start>=0&&end>start);
  const setup=new Function('i','M','b','crtMobile','e','k','n','saved',`let x=saved;${source.slice(start,end)}`);
  setup(selector=>dom.window.document.querySelector(selector),M,b,media,prefs=>writes.push(prefs),{enabled:false},()=>{},saved);
  const button=dom.window.document.querySelector('[data-toggle="crt"]');
  assert(button.hidden&&button.disabled);assert.equal(M.crt,false);assert.equal(M.crtTarget,0);assert.equal(b.crt.u.uIntensity.value,0);
  button.click();assert.deepEqual(writes,[]);
  media.matches=false;media.listener();
  assert(!button.hidden&&!button.disabled);assert.equal(M.crt,saved);assert.equal(M.crtTarget,+saved);
  button.click();assert.equal(M.crt,!saved);assert.deepEqual(writes,[{crt:!saved}]);
  media.matches=true;media.listener();assert.equal(M.crt,false);assert.equal(b.crt.u.uIntensity.value,0);
  media.matches=false;media.listener();assert.equal(M.crt,!saved);
  assert.deepEqual(writes,[{crt:!saved}],'responsive changes must not overwrite the desktop preference');
  dom.window.close();
 }
});

test('mobile CRT starts disabled before the first frame and its responsive listener is disposed',()=>{
 const start=source.indexOf('const crtMobile=matchMedia('),end=source.indexOf('let S=createSnesConsole',start);
 const init=new Function('matchMedia','s','b',source.slice(start,end));
 for(const saved of [true,false,undefined])for(const mobile of [true,false]){
  const b={crt:{u:{uIntensity:{value:-1}}}};
  init(query=>{assert.equal(query,'(max-width:767px), (pointer:coarse) and (max-height:600px)');return {matches:mobile};},{crt:saved},b);
  assert.equal(b.crt.u.uIntensity.value,mobile?0:+(saved??true));
 }
 assert(source.includes('crtMobile.removeEventListener(`change`,syncCrtDevice)'));
});

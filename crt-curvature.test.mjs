import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('src/engine.js','utf8');
const transform=new Function('return '+source.match(/function hv\([^}]+\}/)[0])();
const curvature=Number(source.match(/mv=([.\d]+);function hv/)[1]);
const shader=source.slice(source.indexOf('precision highp float;',source.indexOf('`,_v=`')),source.indexOf('`,vv=class'));
const fract=value=>value-Math.floor(value);
const smoothstep=(a,b,value)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t);};

test('CRT curvature never clips the raster at any intensity, including all four edges and corners',()=>{
 for(const intensity of [0,.25,.5,.75,1]){
  const k=curvature*intensity;
  for(let y=0;y<=100;y++)for(let x=0;x<=100;x++){
   const uv=transform(x/100,y/100,k);
   assert(uv.every(value=>value>=0&&value<=1),`Out-of-bounds raster sample ${x},${y}: ${uv}`);
   if(x===0||x===100)assert.equal(uv[0],x/100);
   if(y===0||y===100)assert.equal(uv[1],y/100);
   if(intensity===0)assert(Math.abs(uv[0]-x/100)<1e-12&&Math.abs(uv[1]-y/100)<1e-12);
  }
 }
 assert.notDeepEqual(transform(.25,.25,curvature),[.25,.25],'CRT retains gentle interior curvature');
});

test('the rolling CRT band stays on the raster through complete cycles, including navigation at arbitrary times',()=>{
 const code=shader.match(/float rollPhase =[^;]+;\s*float roll =[^;]+;/)?.[0];assert(code);
 const roll=new Function('y','t','fract','smoothstep',code.replaceAll('float ','const ').replaceAll('uv.y','y')+'return roll;');
 for(let frame=0;frame<=2000;frame++){
  const time=frame/60;let peak=0;
  for(let row=0;row<=192;row++)peak=Math.max(peak,roll(row/192,time,fract,smoothstep));
  assert(peak>.99,`the band disappeared at ${time.toFixed(3)}s`);
 }
 // The old 0.6-screen period left the entire raster blank for part of a cycle.
 const old=(y,t)=>smoothstep(0,.08,fract(y*.6-t*.07))*(1-smoothstep(.08,.16,fract(y*.6-t*.07)));
 assert.equal(Math.max(...Array.from({length:193},(_,row)=>old(row/192,10))),0,'regression reproduces the original disappearance');
});

test('TV grain persists after transient static ends at every quality while CRT off and reduced motion remain respected',()=>{
 const expression=shader.match(/float grain = ([^;]+);/)?.[1];assert(expression);
 const grain=new Function('uIntensity','uMotion','return '+expression);
 assert(grain(1,1)>0,'persistent grain after boot/static bursts expire');
 assert.equal(grain(0,1),0);assert.equal(grain(1,0),0);
 assert(shader.includes('clamp(uNoise + grain, 0.0, 1.0)'),'boot/cart static is added to persistent grain');
 const block=shader.slice(shader.indexOf('// flicker +'),shader.indexOf('// vignette'));
 assert(!block.includes('uLevel'),'quality changes cannot disable tube grain or roll');
 assert(block.includes('roll * uIntensity * uMotion'),'CRT off and reduced motion also suppress the band');
});

test('automatic high to medium to low fallback preserves CRT intensity, animation and persistent grain',()=>{
 const start=source.indexOf('var dv=class'),end=source.indexOf(',fv=',start);
 const Quality=new Function('Xh',source.slice(start,end)+';return dv;')({high:{fps:45,seconds:3},medium:{fps:28,seconds:3}});
 const callbackStart=source.indexOf('let de=new dv(u,e=>'),callbackEnd=source.indexOf(';function fe()',callbackStart);
 assert(callbackStart>=0&&callbackEnd>callbackStart);
 const uniforms={uLevel:{value:2},uIntensity:{value:1},uMotion:{value:1},uTime:{value:42},uNoise:{value:0}};
 const levels=[],tiers={high:{dpr:2,crtLevel:2},medium:{dpr:1.5,crtLevel:2},low:{dpr:1,crtLevel:1}};
 const quality=new Function('dv','u','d','Yh','l','E','b','fe','console',source.slice(callbackStart,callbackEnd)+';return de;')(
  Quality,'high',tiers.high,tiers,{setPixelRatio(){}},{configure(tier){levels.push(tier.crtLevel);}},{crt:{u:uniforms}},()=>{},{info(){}}
 );
 // The production callback reads window.devicePixelRatio.
 const previous=globalThis.window;globalThis.window={devicePixelRatio:2};
 try{for(let frame=0;frame<100;frame++)quality.tick(.1);}finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
 assert.equal(quality.tier,'low');assert.deepEqual(levels,[2,1]);assert.equal(uniforms.uLevel.value,1);
 assert.equal(uniforms.uIntensity.value,1);assert.equal(uniforms.uMotion.value,1);assert.equal(uniforms.uTime.value,42);assert.equal(uniforms.uNoise.value,0);
});

test('shader sampling and pointer hit coordinates use the same edge-pinned curvature without folding',()=>{
 const shader=source.slice(source.indexOf('vec2 barrel('),source.indexOf('// dark glass'));
 assert(shader.includes('vec2(c.y * c.y, c.x * c.x) * (1.0 - c * c)'));
 for(let row=0;row<=20;row++){
  let previous=-1;
  for(let column=0;column<=100;column++){
   const u=column/100,v=row/20,cx=u*2-1,cy=v*2-1;
   const shaderUV=[cx*(1+curvature*cy*cy*(1-cx*cx))*.5+.5,cy*(1+curvature*cx*cx*(1-cy*cy))*.5+.5];
   assert.deepEqual(transform(u,v,curvature),shaderUV);
   assert(shaderUV[0]>previous);previous=shaderUV[0];
  }
 }
});

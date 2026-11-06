import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('src/engine.js','utf8');
const transform=new Function('return '+source.match(/function hv\([^}]+\}/)[0])();
const curvature=Number(source.match(/mv=([.\d]+);function hv/)[1]);

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

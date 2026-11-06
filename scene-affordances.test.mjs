import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('room interaction cues preserve their millimetre scale and remain still with reduced motion',()=>{
 const source=fs.readFileSync('public/new-room.js','utf8'),start=source.indexOf('function updateInteractionCues('),end=source.indexOf('\n for(let i=0;i<3;i++){',start);
 const cue={visible:true,scale:{x:0,copy(v){this.x=v.x;return this;},multiplyScalar(n){this.x*=n;return this;}}},item={cue,cueScale:{x:.009},object:{userData:{}}},discoveries=new Map([['board',item]]);
 const update=new Function('discoveries','highlighted','return '+source.slice(start,end))(discoveries,'board');
 update(0,false);assert(cue.scale.x<.02);update(2,true);const size=cue.scale.x;update(10,true);assert.equal(cue.scale.x,size);assert(Math.abs(size-.009*1.65)<1e-10);
});

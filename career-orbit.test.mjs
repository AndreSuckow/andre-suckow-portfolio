import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import fs from 'node:fs';
import {createCareerOrbit,attachCareerMapDrag} from './public/career-orbit.js';

test('map orbit rotates only on request, clamps elevation and restores the initial view',()=>{
 const orbit=createCareerOrbit(),initial=orbit.angles;
 orbit.rotate(100,100000);assert(orbit.angles.yaw>initial.yaw);assert.equal(orbit.angles.pitch,Math.PI*.43);
 orbit.rotate(-300,-100000);assert(orbit.angles.yaw<initial.yaw);assert.equal(orbit.angles.pitch,Math.PI/7);
 orbit.reset();assert.deepEqual(orbit.angles,initial);
});

test('TV rotation controls rotate or reset the view without starting a company journey',()=>{
 const source=fs.readFileSync('src/engine.js','utf8'),start=source.indexOf('activate(e=this.selectedItem){'),end=source.indexOf('hitTest(e,t){',start);
 const activate=new Function('return function'+source.slice(start+'activate'.length,end))();
 const actions=[],game={careerMap:{rotate:(x,y)=>actions.push([x,y]),resetView:()=>actions.push('reset'),walkTo:()=>assert.fail('View controls must not move Steve')},invalidate(){}};
 for(const command of ['left','right','reset'])activate.call(game,{kind:'career-view',id:'career-view/'+command});
 assert.deepEqual(actions,[[-36,0],[36,0],'reset']);
});

test('map drag preserves clicks, captures movement outside the map, cancels cleanly and leaves other controls alone',()=>{
 const dom=new JSDOM('<canvas></canvas>'),element=dom.window.document.querySelector('canvas');
 let capture=null,available=true,normalDown=0;const rotations=[],taps=[],map={};
 element.setPointerCapture=id=>{capture=id;};element.hasPointerCapture=id=>capture===id;element.releasePointerCapture=()=>{capture=null;};
 element.style.touchAction='pan-y';
 const controller=attachCareerMapDrag(element,{hitTest:(x,y)=>x>=100&&x<=200&&y>=100&&y<=200?map:null,isAvailable:()=>available,onRotate:(target,dx,dy)=>rotations.push([target,dx,dy]),onTap:(x,y)=>taps.push([x,y])});
 element.addEventListener('pointerdown',()=>normalDown++);
 const send=(name,x,y,id=1)=>{const event=new dom.window.Event(name,{bubbles:true,cancelable:true});Object.assign(event,{clientX:x,clientY:y,pointerId:id,button:0});element.dispatchEvent(event);return event;};
 send('pointerdown',10,10);send('pointerup',10,10);assert.equal(normalDown,1);assert.equal(capture,null);
 send('pointerdown',120,120);send('pointermove',122,121);send('pointerup',122,121);assert.deepEqual(taps,[[122,121]]);assert.equal(rotations.length,0);
 send('pointerdown',120,120);assert.equal(capture,1);send('pointermove',160,140);send('pointermove',240,150);send('pointerup',240,150);
 assert.deepEqual(rotations,[[map,40,20],[map,80,10]]);assert.equal(taps.length,1);assert.equal(capture,null);assert.equal(element.style.touchAction,'pan-y');
 send('pointerdown',120,120);send('pointercancel',120,120);assert.equal(taps.length,1);assert.equal(capture,null);
 send('pointerdown',120,120);available=false;send('pointerup',120,120);assert.equal(taps.length,1);assert.equal(capture,null);
 available=true;send('pointerdown',120,120);controller.dispose();assert.equal(capture,null);assert.equal(element.style.touchAction,'pan-y');
 send('pointerdown',120,120);assert.equal(normalDown,2);dom.window.close();
});

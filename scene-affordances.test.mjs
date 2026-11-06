import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {interactionShake,interactionShakeFrames,interactionShakeDuration,createInteractionCascade} from './public/interaction-motion.js';
import {createSceneAffordances} from './public/scene-affordances.js';

test('room objects shake without markers, and open drawers stay anchored',()=>{
 const source=fs.readFileSync('public/new-room.js','utf8'),start=source.indexOf('function updateInteractionCues('),end=source.indexOf('\n for(let i=0;i<3;i++){',start);
 const make=(lift,restZ)=>({object:{rotation:{z:restZ},userData:{}},lift,restZ});
 const board=make(.022,.025),poster=make(0,0),drawer=make(0,.04),discoveries=new Map([['board',board],['poster-mario',poster],['notebook',drawer]]);
 let shadowUpdates=0;const api=new Function('discoveries','interactionShake','T','let highlighted=null,focusStarted=0,lastCueTime=0,automatic=null,automaticStarted=0;'+source.slice(start,end)+';return {update:updateInteractionCues,focus(id){highlighted=id;focusStarted=lastCueTime}}')(discoveries,interactionShake,{invalidateShadows(){shadowUpdates++}});
 api.focus('board');api.update(.04,false);assert.equal(board.object.rotation.z,.025+interactionShake(.04));
 api.update(.5,false);assert.equal(board.object.rotation.z,.025);assert(shadowUpdates>0);const stoppedUpdates=shadowUpdates;api.update(.51,false);assert.equal(shadowUpdates,stoppedUpdates);api.focus('poster-mario');api.update(.54,false);assert(poster.object.rotation.z!==0);
 api.focus('notebook');api.update(.58,false);assert.equal(drawer.object.rotation.z,.04+interactionShake(.04)*.25);assert.equal(poster.object.rotation.z,0);
 drawer.object.userData.drawerOpen=true;api.update(.59,false);assert.equal(drawer.object.rotation.z,.04);
 api.focus('board');api.update(.6,true);assert.equal(board.object.rotation.z,.025);
});

test('cascade starts just one object every five seconds and repeats its order',()=>{
 const starts=[],ends=[],cascade=createInteractionCascade({items:['one','two','three'],onStart:(item,time)=>starts.push([item,time]),onEnd:item=>ends.push(item)});
 assert.equal(cascade.tick(0),null);assert.equal(cascade.tick(4.99),null);assert.equal(cascade.tick(5).item,'one');assert.equal(cascade.tick(5.2).item,'one');assert.equal(cascade.tick(5.5),null);
 assert.equal(cascade.tick(10).item,'two');assert.equal(cascade.tick(15).item,'three');assert.equal(cascade.tick(20).item,'one');
 assert.deepEqual(starts,[['one',5],['two',10],['three',15],['one',20]]);assert.deepEqual(ends,['one','two','three']);cascade.dispose();assert.equal(ends.at(-1),'one');
});

test('cascade skips occluded items, cancels on interaction and never catches up in a simultaneous burst',()=>{
 const starts=[],ends=[],cascade=createInteractionCascade({items:['hidden','a','b'],eligible:item=>item!=='hidden',onStart:item=>starts.push(item),onEnd:item=>ends.push(item)});
 assert.equal(cascade.tick(5).item,'a');cascade.interrupt(5.1);assert.equal(cascade.current,null);assert.deepEqual(ends,['a']);assert.equal(cascade.tick(10),null);assert.equal(cascade.tick(10.1).item,'b');
 assert.equal(cascade.tick(100).item,'a');assert.equal(starts.length,3);assert.equal(cascade.tick(100.1).item,'a');assert.equal(starts.length,3);
 cascade.tick(100.2,{blocked:true});assert.equal(cascade.current,null);assert.equal(cascade.tick(103),null);
 cascade.tick(200,{reduced:true});assert.equal(cascade.current,null);assert.equal(cascade.tick(204.99),null);assert.equal(cascade.tick(205).item,'b');cascade.dispose();
});

test('scene cascade is available at the shelf and opening, while reading and insertion suspend it',()=>{
 const source=fs.readFileSync('src/engine.js','utf8'),expression=source.match(/createRoomCascade\(\{[\s\S]*?isAvailable:\(\)=>([\s\S]*?)\}\);let me=/)[1];
 const available=new Function('projectBusy','w','O','M','return ('+expression+')');
 const carts={busy:false,inserted:null},state={focus:0};
 assert.equal(available(false,carts,{cameraChapter:'intro',active:'intro'},state),true);
 assert.equal(available(false,carts,{cameraChapter:'projetos',active:'projetos'},state),true);
 assert.equal(available(true,carts,{cameraChapter:'projetos',active:'projetos'},state),false);
 assert.equal(available(false,carts,{cameraChapter:'skills',active:'skills'},state),false);
 assert.equal(available(false,{busy:false,inserted:{}},{cameraChapter:'projetos',active:'projetos'},state),false);
});

test('shared shake preserves the companies motion and ends after one brief pulse',()=>{
 for(let elapsed=0;elapsed<1;elapsed+=.002){const original=elapsed<.42?Math.sin(elapsed*42)*.035*(1-elapsed/.42):0;assert.equal(interactionShake(elapsed),original);assert.equal(interactionShake(elapsed,true),0);}
 assert.equal(interactionShake(-1),0);assert.equal(interactionShake(1),0);
 const frames=interactionShakeFrames(.2);assert(Math.abs(frames.reduce((sum,f)=>sum+f.duration,0)-interactionShakeDuration)<1e-10);assert.equal(frames.at(-1).z,.2);assert(frames.every(f=>Math.abs(f.z-.2)<=.035));
});

test('equipment shake is subtle, resets exactly and leaves cartridge transforms to their own animation',()=>{
 class Vector3{constructor(x,y,z){Object.assign(this,{x,y,z})}copy(v){Object.assign(this,v);return this}}
 class Box3{setFromObject(){this.min={x:0,y:0,z:0};this.max={x:1,y:1,z:1};return this}}
 class BoxGeometry{constructor(width){this.width=width}dispose(){}}
 class Material{dispose(){}}
 class Mesh{constructor(geometry){this.geometry=geometry;this.position=new Vector3();this.rotation={z:0};this.userData={};this.scale={x:1,setScalar(n){this.x=n}}}removeFromParent(){}}
 const make=()=>({rotation:{z:.1},children:[],updateWorldMatrix(){},worldToLocal(){},add(mesh){this.children.push(mesh)}}),tv=make(),cart=make();
 const cues=createSceneAffordances({Box3,Vector3,BoxGeometry,Mesh,Material},[{key:'tv',root:tv,shakeScale:.22},{key:'cart/one',root:cart}]);
 cues.highlight('tv');cues.update(.04,false);assert.equal(tv.rotation.z,.1+interactionShake(.04)*.22);assert.equal(cart.rotation.z,.1);assert.equal(tv.children.length,0);assert.equal(cart.children.length,0);
 cues.update(.5,false);assert.equal(tv.rotation.z,.1);cues.highlight(null);cues.update(.55,false);assert.equal(tv.rotation.z,.1);
 cues.highlight('tv');cues.update(.57,true);assert.equal(tv.rotation.z,.1);cues.dispose();assert.equal(tv.rotation.z,.1);
});

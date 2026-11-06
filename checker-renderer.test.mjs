import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {checkerPieces,createCheckerTemplate,installCheckerRenderer,checkerModelURL} from './public/board-games/checker-renderer.js';

class Vector3{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z})}set(x,y,z){Object.assign(this,{x,y,z});return this}sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this}}
class Group{constructor(){this.children=[];this.position=new Vector3();this.scale={setScalar(n){this.value=n}}}add(...children){this.children.push(...children)}clear(){this.children=[]}traverse(fn){fn(this);for(const child of this.children)child.traverse?child.traverse(fn):fn(child)}clone(){const copy=new Group();copy.add(...this.children.map(c=>c.clone()));return copy}}
function material(color='original-black'){return {color:{value:color,set(value){this.value=value}},clone(){return material(this.color.value)},dispose(){this.disposed=true}}}
function source(){const geometry={dispose(){this.disposed=true}},original=material();const mesh={isMesh:true,geometry,material:original,clone(){return {...this}}};const root=new Group();root.add(mesh);return {root,original,geometry}}
class Box3{constructor(){this.min={y:-.2}}setFromObject(){return this}getSize(v){return v.set(2,.4,2)}getCenter(v){return v.set(0,0,0)}}
test('supplied geometry is shared by the black and white stones, without recoloring the original',()=>{
 const s=source(),prepared=createCheckerTemplate({Box3,Vector3,Group},s.root);
 const black=prepared.templates[0].children[0].children[0],white=prepared.templates[1].children[0].children[0];
 assert.equal(black.geometry,s.geometry);assert.equal(white.geometry,s.geometry);
 assert.equal(black.material.color.value,'original-black');assert.equal(white.material.color.value,'#f1eee6');assert.equal(s.original.color.value,'original-black');
 assert.equal(prepared.height,.144);prepared.dispose();assert(s.geometry.disposed);assert(white.material.disposed);
 assert(checkerModelURL.pathname.endsWith('/pedra_jogo_de_damas/scene.gltf'));
});
test('piece positions, side and promotion follow the actual game state',()=>{
 const board=Array(64).fill(0);board[1]=-1;board[56]=2;
 assert.deepEqual(checkerPieces(board),[{index:1,x:-2.5,z:-3.5,white:false,king:false},{index:56,x:-3.5,z:3.5,white:true,king:true}]);
 assert.equal(checkerPieces(Array(64).fill(0)).length,0);
});
test('one renderer updates moves and stacked kings, then releases its resources',async()=>{
 const dom=new JSDOM('<div><canvas></canvas></div>',{pretendToBeVisual:true}),win=dom.window,doc=win.document,canvas=doc.querySelector('canvas');let renders=0,instances=0,lastScene;
 canvas.getBoundingClientRect=()=>({width:400,height:400});win.ResizeObserver=class{observe(){}disconnect(){}};
 class Renderer{constructor(){instances++}setClearColor(){}setPixelRatio(){}setSize(){}render(scene){renders++;lastScene=scene}dispose(){}forceContextLoss(){}}
 class Camera extends Group{constructor(){super();this.up=new Vector3()}lookAt(){}}
 const asset=source();class Loader{async loadAsync(){return {scene:asset.root}}}
 const api=installCheckerRenderer({Renderer,Scene:Group,Group,OrthographicCamera:Camera,Box3,Vector3,HemisphereLight:Group,DirectionalLight:Group,Loader},{doc,win});
 const board=Array(64).fill(0);board[1]=-1;board[56]=1;
 const update=()=>doc.dispatchEvent(new win.CustomEvent('board:checkers-render',{detail:{canvas,board}}));
 update();await new Promise(r=>win.setTimeout(r,50));assert.equal(canvas.dataset.ready,'true');assert.equal(canvas.dataset.pieces,'2');assert.equal(instances,1);
 board[56]=0;board[49]=2;update();await new Promise(r=>win.setTimeout(r,50));assert.equal(instances,1);assert.equal(lastScene.children[0].children.length,3,'one stone and two stacked stones');assert(renders>=2);
 api.dispose();assert.equal(canvas.dataset.ready,undefined);dom.window.close();
});

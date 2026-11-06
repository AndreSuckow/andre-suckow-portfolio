import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('public/new-room.js','utf8');
function makePoster(maxAnisotropy){
 const resources=[],meshes=[],posterModels=new Map();
 class CanvasTexture{constructor(image){this.image=image;}}
 class Group{constructor(){this.position={set(){}};this.rotation={set(){}};}}
 class BasicMaterial{constructor(options){Object.assign(this,options);}}
 const box=(name,x,y,z,width,height,depth,material)=>{const mesh={name,z,width,height,depth,material};meshes.push(mesh);return mesh};
 const plane=(name,x,y,z,width,height,material)=>{const mesh={name,z,width,height,material,receiveShadow:true,castShadow:true,userData:{}};meshes.push(mesh);return mesh};
 const start=source.indexOf('function poster('),end=source.indexOf('\n function discovery(',start);
 const create=new Function('CanvasTexture','SRGB','resources','Group','box','plane','material','interactive','discovery','posterModels','T','return '+source.slice(start,end))(CanvasTexture,'srgb',resources,Group,box,plane,color=>({color}),{add(){}},()=>{},posterModels,{BasicMaterial,maxAnisotropy});
 const image={width:781,height:1200};create('poster-megaman','Mega Man X',image,1,1,1,.32);
 return {meshes,resources,image,posterModels};
}

test('poster print stays separated from its backing, writes depth and cannot blend with the wall',()=>{
 const {meshes,image,posterModels}=makePoster(16),[paper,art]=meshes;
 assert(art.z-paper.depth/2>=.0009,'at least .9mm of separation, rather than the old .1mm');
 assert.equal(art.material.transparent,false);assert.equal(art.material.opacity,1);
 assert.equal(art.material.depthTest,true);assert.equal(art.material.depthWrite,true);
 assert.equal(art.material.polygonOffset,true);assert(art.material.polygonOffsetFactor<0);assert(art.material.polygonOffsetUnits<0);
 assert.equal(art.receiveShadow,false);assert.equal(art.castShadow,false);assert.equal(art.material.toneMapped,false);
 assert.equal(art.material.map.image,image,'preserve source image resolution');
 assert.equal(art.height,.32*1200/781);assert(posterModels.has('poster-megaman'));
});

test('poster texture uses available anisotropy with mipmaps and respects hardware limits',()=>{
 for(const [available,expected] of [[1,1],[4,4],[16,16],[32,16],[undefined,8]]){
  const {meshes}=makePoster(available),map=meshes[1].material.map;
  assert.equal(map.anisotropy,expected);assert.equal(map.generateMipmaps,true);assert.equal(map.colorSpace,'srgb');
 }
 assert.match(fs.readFileSync('src/engine.js','utf8'),/createNewRoom\(\{maxAnisotropy:l\.capabilities\.getMaxAnisotropy\(\)/);
});

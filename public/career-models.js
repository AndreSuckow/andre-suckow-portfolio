// Adapt the supplied assets at runtime while preserving the original downloads.
export function clearCareerRoute(geometry,{roadX,stations,buildings,floor=.2}={}){
 const position=geometry.attributes.position,index=geometry.index;
 const kept=[];
 const clear=(x,z)=>Math.abs(x-roadX)<.2||stations.some(([sx,sz])=>Math.abs(z-sz)<.2&&x>=Math.min(roadX,sx)-.16&&x<=Math.max(roadX,sx)+.16)||buildings.some(([bx,bz])=>Math.abs(x-bx)<.57&&Math.abs(z-bz)<.52);
 for(let triangle=0;triangle<(index?.count??position.count);triangle+=3){
  const vertices=[0,1,2].map(offset=>index?index.getX(triangle+offset):triangle+offset);
  const vegetation=Math.max(...vertices.map(i=>position.getY(i)))>floor;
  if(vegetation&&vertices.some(i=>clear(position.getX(i),position.getZ(i))))continue;
  kept.push(...vertices);
 }
 geometry.setIndex(kept);return geometry;
}

export async function loadCareerTerrain(T,layout){
 const {Loader,Box3,Vector3,Group,BasicMaterial}=T;
 const gltf=await new Loader().loadAsync(new URL('./models/minecraft_jungle_map/scene.gltf',import.meta.url).href);
 gltf.scene.updateMatrixWorld(true);
 const bounds=new Box3().setFromObject(gltf.scene),size=bounds.getSize(new Vector3()),center=bounds.getCenter(new Vector3()),scale=4.3/size.x;
 const root=new Group();
 gltf.scene.traverse(object=>{
  if(!object.isMesh)return;
  const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld);
  geometry.translate(-center.x,0,-center.z);geometry.scale(scale,scale,scale);
  clearCareerRoute(geometry,layout);
  object.geometry.dispose();object.geometry=geometry;
  const original=object.material;
  object.material=new BasicMaterial({map:original.map,side:original.side,transparent:original.transparent,alphaTest:original.alphaTest});
  if(original.map){original.map.magFilter=1003;original.map.minFilter=1008;original.map.generateMipmaps=true;original.map.anisotropy=4;original.map.needsUpdate=true;}
  original.dispose();
  object.position.set(0,0,0);object.rotation.set(0,0,0);object.scale.set(1,1,1);
  root.add(object.clone());
 });
 return root;
}

export function careerAvatarChoice(search){const choice=new URLSearchParams(search).get('avatar');return choice==='chief'||choice==='steve'?choice:'andre';}

export async function loadCareerSteve(T,{personalized=false}={}){
 const {Loader,Box3,Vector3,Group,Mesh,BasicMaterial}=T;
 const gltf=await new Loader().loadAsync(new URL('./models/minecraft_-_steve/scene.gltf',import.meta.url).href);
 gltf.scene.updateMatrixWorld(true);
 let source;gltf.scene.traverse(object=>{if(object.isMesh)source=object;});
 if(!source||source.geometry.attributes.position.count!==144)throw Error('Unexpected Steve mesh layout');
 const bounds=new Box3().setFromObject(gltf.scene),center=bounds.getCenter(new Vector3()),scale=.78/(bounds.max.y-bounds.min.y);
 const geometry=source.geometry.clone().applyMatrix4(source.matrixWorld);
 geometry.translate(-center.x,-bounds.min.y,-center.z);geometry.scale(scale,scale,scale);
 const root=new Group(),parts={},names=['torso','head','rightArm','leftArm','rightLeg','leftLeg'];
 const material=new BasicMaterial({map:source.material.map});
 material.map.magFilter=1003;material.map.minFilter=1003;material.map.generateMipmaps=false;material.map.needsUpdate=true;
 names.forEach((name,part)=>{
  const positions=geometry.attributes.position,indices=[];
  for(let i=0;i<geometry.index.count;i+=3){const triangle=[0,1,2].map(offset=>geometry.index.getX(i+offset));if(triangle.every(index=>Math.floor(index/24)===part))indices.push(...triangle);}
  const pivot=new Vector3();let maxY=-Infinity;
  for(let i=part*24;i<(part+1)*24;i++){pivot.x+=positions.getX(i)/24;pivot.z+=positions.getZ(i)/24;maxY=Math.max(maxY,positions.getY(i));}
  pivot.y=name.includes('Arm')||name.includes('Leg')?maxY:0;
  const piece=geometry.clone();piece.setIndex(indices);piece.translate(-pivot.x,-pivot.y,-pivot.z);
  const mesh=new Mesh(piece,material);mesh.position.copy(pivot);root.add(mesh);parts[name]=mesh;
 });
 geometry.dispose();source.geometry.dispose();source.material.dispose();
 if(personalized){
  const imageURL=new URL('./img/andre-minecraft-face.webp',import.meta.url);imageURL.search=new URL(import.meta.url).search;
  const image=new Image();image.src=imageURL.href;await image.decode();
  const texture=new T.CanvasTexture(image);texture.colorSpace=T.SRGB;texture.magFilter=1003;texture.minFilter=1003;texture.generateMipmaps=false;
  const head=parts.head,headBounds=new Box3();headBounds.makeEmpty();
  const pos=head.geometry.attributes.position,vertex=new Vector3();
  for(let i=0;i<head.geometry.index.count;i++)headBounds.expandByPoint(vertex.fromBufferAttribute(pos,head.geometry.index.getX(i)));
  const headSize=headBounds.getSize(new Vector3()),headCenter=headBounds.getCenter(new Vector3());
  const headGeometry=new T.BoxGeometry(headSize.x,headSize.y,headSize.z);headGeometry.translate(headCenter.x,headCenter.y,headCenter.z);
  const temple=(offset)=>{const map=texture.clone();map.repeat.set(.16,1);map.offset.set(offset,0);map.needsUpdate=true;return new BasicMaterial({map});};
  head.geometry.dispose();head.geometry=headGeometry;
  head.material=[temple(0),temple(.84),new BasicMaterial({color:'#2a201d'}),new BasicMaterial({color:'#35231e'}),new BasicMaterial({map:texture}),new BasicMaterial({color:'#2a201d'})];
  // The dark shirt follows the existing portrait; original trousers and skin remain.
  parts.torso.material=new BasicMaterial({color:'#182337'});
  for(const arm of [parts.leftArm,parts.rightArm]){
   const bounds=new Box3().makeEmpty(),position=arm.geometry.attributes.position;
   for(let i=0;i<arm.geometry.index.count;i++)bounds.expandByPoint(vertex.fromBufferAttribute(position,arm.geometry.index.getX(i)));
   const size=bounds.getSize(new Vector3()),center=bounds.getCenter(new Vector3()),height=size.y/3+.003;
   const sleeve=new Mesh(new T.BoxGeometry(size.x+.003,height,size.z+.003),new BasicMaterial({color:'#182337'}));
   sleeve.position.set(center.x,bounds.max.y-height/2,center.z);arm.add(sleeve);
  }
 }
 return {root,parts};
}

export async function loadCareerChief(T){
 const {Loader,Box3,Vector3,Group,Mesh,BasicMaterial}=T;
 const gltf=await new Loader().loadAsync(new URL('./models/master_chief/scene.gltf',import.meta.url).href);
 const names={head:'Head_',torso:'Body_',rightArm:'RightArm_',leftArm:'LeftArm_',rightLeg:'RightLeg_',leftLeg:'LeftLeg_'};
 const joints={};
 gltf.scene.traverse(node=>{
  if(node.name==='bone_18')node.quaternion.identity();
  for(const [part,prefix]of Object.entries(names))if(node.name.startsWith(prefix)){node.quaternion.identity();joints[part]=node;}
 });
 if(Object.keys(joints).length!==6)throw Error('Master Chief is missing a body part');
 gltf.scene.updateMatrixWorld(true);
 const bounds=new Box3().setFromObject(gltf.scene),center=bounds.getCenter(new Vector3()),origin=new Vector3(center.x,bounds.min.y,center.z),scale=.78/(bounds.max.y-bounds.min.y);
 const root=new Group(),parts={},materials=new Map(),originalMaterials=new Set();
 for(const [name,joint]of Object.entries(joints)){
  const pivot=joint.getWorldPosition(new Vector3()).sub(origin).multiplyScalar(scale),part=new Group();part.position.copy(pivot);root.add(part);parts[name]=part;
  joint.traverse(object=>{
   if(!object.isMesh)return;
   const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld);
   geometry.translate(-origin.x,-origin.y,-origin.z);geometry.scale(scale,scale,scale);geometry.translate(-pivot.x,-pivot.y,-pivot.z);
   const original=object.material;originalMaterials.add(original);
   if(!materials.has(original)){
    const material=new BasicMaterial({map:original.map,side:original.side,alphaTest:original.alphaTest,transparent:original.transparent});
    if(material.map){material.map.magFilter=1003;material.map.minFilter=1003;material.map.generateMipmaps=false;material.map.needsUpdate=true;}
    materials.set(original,material);
   }
   part.add(new Mesh(geometry,materials.get(original)));object.geometry.dispose();
  });
 }
 for(const material of originalMaterials)material.dispose();
 // This skin's visor faces local -Z; the journey uses +Z as its forward axis.
 root.rotation.y=Math.PI;
 return {root,parts};
}

// Small physical amber markers make interactive equipment discoverable at rest.
export function createSceneAffordances(T,items){
 const {Box3,Vector3,BoxGeometry,Mesh,Material}=T;
 const geometry=new BoxGeometry(.009,.009,.009),material=new Material({color:'#ffb547',emissive:'#ffb547',emissiveIntensity:.65,roughness:.5}),markers=[];
 let active=null;
 for(const {key,root}of items){
  root.updateWorldMatrix(true,true);const bounds=new Box3().setFromObject(root),point=new Vector3((bounds.min.x+bounds.max.x)/2,bounds.max.y+.018,(bounds.min.z+bounds.max.z)/2);
  root.worldToLocal(point);const mesh=new Mesh(geometry,material);mesh.name='Clickable equipment · '+key;mesh.position.copy(point);mesh.rotation.z=Math.PI/4;mesh.userData.interactionCue=true;root.add(mesh);markers.push({key,mesh});
 }
 return {highlight(key){active=key;},update(time,reduced){markers.forEach(({key,mesh},i)=>{const pulse=reduced?1:1+.13*Math.sin(time*2.4+i);mesh.scale.setScalar((key===active?1.8:1)*pulse);});},dispose(){for(const {mesh}of markers)mesh.removeFromParent();geometry.dispose();material.dispose();}};
}

import {interactionShake} from './interaction-motion.js?v=cs-mode-3';
// Small physical amber markers make interactive equipment discoverable at rest.
export function createSceneAffordances(T,items){
 const {Box3,Vector3,BoxGeometry,Mesh,Material}=T;
 const geometry=new BoxGeometry(.009,.009,.009),material=new Material({color:'#ffb547',emissive:'#ffb547',emissiveIntensity:.65,roughness:.5}),markers=[];
 let active=null,started=0,lastTime=0;
 for(const {key,root,shakeScale=0}of items){
  root.updateWorldMatrix(true,true);const bounds=new Box3().setFromObject(root),point=new Vector3((bounds.min.x+bounds.max.x)/2,bounds.max.y+.018,(bounds.min.z+bounds.max.z)/2);
  root.worldToLocal(point);const mesh=new Mesh(geometry,material);mesh.name='Clickable equipment · '+key;mesh.position.copy(point);mesh.rotation.z=Math.PI/4;mesh.userData.interactionCue=true;root.add(mesh);markers.push({key,mesh,root,restZ:root.rotation.z,shakeScale});
 }
 return {highlight(key){if(key!==active){active=key;started=lastTime;}},update(time,reduced){lastTime=time;markers.forEach(({key,mesh,root,restZ,shakeScale},i)=>{const focused=key===active,pulse=reduced?1:1+.13*Math.sin(time*2.4+i),shake=focused?interactionShake(time-started,reduced):0;mesh.scale.setScalar((focused?1.8:1)*pulse);mesh.rotation.z=Math.PI/4+shake;if(shakeScale){const rotation=restZ+shake*shakeScale;if(root.rotation.z!==rotation){root.rotation.z=rotation;T.invalidateShadows?.();}}});},dispose(){for(const {mesh,root,restZ,shakeScale}of markers){mesh.removeFromParent();if(shakeScale)root.rotation.z=restZ;}geometry.dispose();material.dispose();}};
}

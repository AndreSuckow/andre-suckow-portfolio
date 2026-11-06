import {interactionShake} from './interaction-motion.js?v=cs-mode-3';
// Discoverability comes from the equipment itself, without floating markers.
export function createSceneAffordances(T,items){
 const objects=items.map(({key,root,shakeScale=0})=>({key,root,restZ:root.rotation.z,shakeScale}));
 let active=null,started=0,lastTime=0,automatic=null,automaticStarted=0;
 return {
  get focused(){return active;},objects(){return objects.map(({key,root})=>({key,root}));},
  automaticHighlight(key,time=lastTime){automatic=key;automaticStarted=time;},
  highlight(key){if(key!==active){active=key;started=lastTime;}},
  update(time,reduced){
   lastTime=time;
   for(const {key,root,restZ,shakeScale}of objects){
    const manual=key===active,focused=manual||key===automatic,shake=focused?interactionShake(time-(manual?started:automaticStarted),reduced):0;
    if(shakeScale){const rotation=restZ+shake*shakeScale;if(root.rotation.z!==rotation){root.rotation.z=rotation;T.invalidateShadows?.();}}
   }
  },
  dispose(){for(const {root,restZ,shakeScale}of objects)if(shakeScale)root.rotation.z=restZ;}
 };
}

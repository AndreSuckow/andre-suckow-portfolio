import {createInteractionCascade,automaticInteractionShake} from './interaction-motion.js?v=cs-mode-3';

export function createRoomCascade(T,{doc=document}={}){
 const {room,equipment,carts,camera,canvas,pick,Box3,Vector3,isAvailable}=T;
 const ray=new T.Raycaster(),occluders=[];
 T.scene.traverseVisible(object=>{if(object.isMesh&&!object.userData.interactionCue)occluders.push(object);});
 const cartItems=carts.carts.map(cart=>({key:'cart/'+cart.slug,root:cart.root,cart}));
 const items=[...cartItems,...(room?.interactionObjects()||[]),...equipment.objects().filter(item=>item.key!=='tv'&&!item.key.startsWith('cart/'))];
 let latestTime=0;
 const clear=item=>{
  room?.automaticHighlight(null);equipment.automaticHighlight(null);
  if(item.cart&&!carts.busy&&item.cart!==carts.inserted){item.root.rotation.z=0;T.invalidateShadows?.();}
 };
 const cascade=createInteractionCascade({items,
  eligible(item){
   if(item.root.userData.drawerOpen)return false;
   if(item.cart&&(carts.busy||item.cart===carts.inserted))return false;
   if(item.key===room?.focused||item.key===equipment.focused)return false;
   item.root.updateWorldMatrix(true,true);
   const point=new Box3().setFromObject(item.root).getCenter(new Vector3()).project(camera);
   if(point.z< -1||point.z>1||Math.abs(point.x)>.94||Math.abs(point.y)>.94)return false;
   const rect=canvas.getBoundingClientRect(),hit=pick(rect.left+(point.x+1)*rect.width/2,rect.top+(1-point.y)*rect.height/2);
   const clickable=hit?.kind==='cart'?'cart/'+hit.slug===item.key:hit?.kind==='room'?hit.id===item.key:item.key==='tv'?hit?.kind==='screen':item.key==='console'&&hit?.kind==='button';
   if(!clickable)return false;
   ray.setFromCamera(point,camera);let visible=ray.intersectObjects(occluders,false)[0]?.object;
   while(visible){if(visible===item.root)return true;visible=visible.parent;}return false;
  },
  onStart(item,time){if(item.cart||item.key==='tv'||item.key==='console')equipment.automaticHighlight(item.key,time);else room?.automaticHighlight(item.key,time);},onEnd:clear
 });
 const interrupt=()=>cascade.interrupt(latestTime);
 const reducedMedia=doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)');reducedMedia.addEventListener('change',interrupt);
 const events=['pointerdown','click','keydown','wheel','touchstart','focusin','room:focus','resume:skill-open','visibilitychange'];
 for(const name of events)doc.addEventListener(name,interrupt,{capture:true,passive:true});
 const modes=new MutationObserver(interrupt);modes.observe(doc.documentElement,{attributes:true,attributeFilter:['data-mode']});
 return {get current(){return cascade.current;},interrupt,
  tick(time,reduced=false){
   latestTime=time;
   reduced=reduced||reducedMedia.matches;
   const pulse=cascade.tick(time,{reduced,blocked:doc.hidden||doc.documentElement.dataset.mode!=='3d'||!!doc.documentElement.dataset.paused||!!doc.querySelector('dialog[open]')||!isAvailable()});
   if(pulse?.item.cart&&!carts.busy&&pulse.item.cart!==carts.inserted){pulse.item.root.rotation.z=automaticInteractionShake(pulse.elapsed,reduced);T.invalidateShadows?.();}
  },
  dispose(){cascade.dispose();modes.disconnect();reducedMedia.removeEventListener('change',interrupt);for(const name of events)doc.removeEventListener(name,interrupt,true);}
 };
}

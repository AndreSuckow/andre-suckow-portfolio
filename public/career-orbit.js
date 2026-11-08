export function createCareerOrbit({yaw=Math.atan2(.4,10),pitch=Math.atan2(9.26,Math.hypot(.4,10))}={}){
 const initial={yaw,pitch};let current={...initial};
 return {
  get angles(){return {...current};},
  rotate(dx,dy){current.yaw+=dx*.008;current.pitch=Math.max(Math.PI/7,Math.min(Math.PI*.43,current.pitch+dy*.006));return {...current};},
  reset(){current={...initial};return {...current};}
 };
}

// Own only gestures that start inside the map, leaving the TV and page controls intact.
export function attachCareerMapDrag(element,{hitTest,onRotate,onTap,onEnd=()=>{},isAvailable=()=>true,threshold=7}){
 let active=null;
 const previousTouchAction=element.style.touchAction;
 function end(event,cancelled=false){
  if(!active||event&&event.pointerId!==undefined&&event.pointerId!==active.id)return;
  const gesture=active;active=null;
  element.style.touchAction=previousTouchAction;element.style.cursor='grab';
  if(element.hasPointerCapture?.(gesture.id))element.releasePointerCapture(gesture.id);
  onEnd({dragged:gesture.dragged,cancelled});
  if(!cancelled&&!gesture.dragged&&Math.hypot(event.clientX-gesture.startX,event.clientY-gesture.startY)<threshold)onTap(event.clientX,event.clientY);
 }
 function down(event){
  if(event.button!==undefined&&event.button!==0||active)return;
  const map=hitTest(event.clientX,event.clientY);if(!map)return;
  active={map,id:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,dragged:false};
  element.style.touchAction='none';element.style.cursor='grabbing';
  element.setPointerCapture?.(event.pointerId);
  event.preventDefault();event.stopImmediatePropagation();
 }
 function move(event){
  if(!active||event.pointerId!==active.id)return;
  if(!isAvailable()){end(event,true);return;}
  const distance=Math.hypot(event.clientX-active.startX,event.clientY-active.startY);
  if(!active.dragged&&distance>=threshold)active.dragged=true;
  if(active.dragged){onRotate(active.map,event.clientX-active.x,event.clientY-active.y);active.x=event.clientX;active.y=event.clientY;}
  element.style.cursor='grabbing';event.preventDefault();event.stopImmediatePropagation();
 }
 function up(event){if(!active||event.pointerId!==active.id)return;event.stopImmediatePropagation();end(event,!isAvailable());}
 function cancel(event){if(active){event?.stopImmediatePropagation?.();end(event,true);}}
 function touch(event){const point=event.touches[0];if(point&&hitTest(point.clientX,point.clientY)){event.preventDefault();event.stopImmediatePropagation();}}
 const bindings=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel],['touchstart',touch]];
 for(const [name,listener]of bindings)element.addEventListener(name,listener,{capture:true,passive:false});
 const blur=()=>end(null,true);globalThis.window?.addEventListener('blur',blur);
 return {get dragging(){return !!active;},dispose(){end(null,true);for(const [name,listener]of bindings)element.removeEventListener(name,listener,true);globalThis.window?.removeEventListener('blur',blur);}};
}

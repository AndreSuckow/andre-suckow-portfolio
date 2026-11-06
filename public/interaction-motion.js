// The same short, damped shake used by the companies on the career map.
export const interactionShakeDuration=.42;
export function interactionShake(elapsed,reduced=false,amplitude=.035){
 return !reduced&&elapsed>=0&&elapsed<interactionShakeDuration?Math.sin(elapsed*42)*amplitude*(1-elapsed/interactionShakeDuration):0;
}
// Keyframes keep cartridge motion on its rotation tween, so insertion can cancel it.
export function interactionShakeFrames(rest=0){
 const steps=14,duration=interactionShakeDuration/steps;
 return Array.from({length:steps},(_,i)=>({z:rest+interactionShake((i+1)*duration),duration,ease:'none'}));
}

// One shared clock prevents independent objects from starting together.
export function createInteractionCascade({items,onStart=()=>{},onEnd=()=>{},eligible=()=>true,interval=5}={}){
 let current=null,index=0,nextAt=interval,lastTime=0;
 function stop(){if(current)onEnd(current.item);current=null;}
 function interrupt(time=lastTime){stop();nextAt=time+interval;}
 return {get current(){return current;},interrupt,tick(time,{blocked=false,reduced=false}={}){
  lastTime=time;if(blocked||reduced){interrupt(time);return null;}
  if(current&&time-current.started>=interactionShakeDuration)stop();
  if(!current&&time>=nextAt){
   nextAt=time+interval;
   for(let count=0;count<items.length;count++){const item=items[index];index=(index+1)%items.length;if(!eligible(item))continue;current={item,started:time};onStart(item,time);break;}
  }
  return current?{...current,elapsed:time-current.started}:null;
 },dispose:stop};
}

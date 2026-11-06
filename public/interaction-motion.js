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

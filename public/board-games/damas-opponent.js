import {chooseDamaMove} from './damas-computer.js?v=cs-mode-3';

export function createDamaOpponent({WorkerClass=globalThis.Worker,setTimer=setTimeout,clearTimer=clearTimeout,choose=chooseDamaMove,delay=350}={}){
 let timer=null,worker=null,generation=0,pending=false;
 function cancel(){generation++;pending=false;if(timer!==null)clearTimer(timer);timer=null;worker?.terminate();worker=null;}
 return {get pending(){return pending;},cancel,request(board,turn,done){
  cancel();pending=true;const ticket=generation,position=[...board];
  const finish=move=>{if(ticket!==generation)return;pending=false;worker?.terminate();worker=null;done(move);};
  const fallback=()=>{if(ticket!==generation)return;worker?.terminate();worker=null;finish(choose(position,turn,{timeLimit:25,nodeLimit:1200}));};
  timer=setTimer(()=>{
   timer=null;if(ticket!==generation)return;
   if(!WorkerClass){fallback();return;}
   try{worker=new WorkerClass(new URL('./damas-worker.js?v=cs-mode-3',import.meta.url),{type:'module'});worker.onmessage=event=>event.data.error?fallback():finish(event.data.move);worker.onerror=fallback;worker.postMessage({board:position,turn});}
   catch{fallback();}
  },delay);
 }};
}

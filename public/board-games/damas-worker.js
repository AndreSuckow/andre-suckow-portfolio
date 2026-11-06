import {chooseDamaMove} from './damas-computer.js?v=cs-mode-3';
self.onmessage=event=>{
 try{const {board,turn}=event.data;self.postMessage({move:chooseDamaMove(board,turn)});}
 catch{self.postMessage({error:true});}
};

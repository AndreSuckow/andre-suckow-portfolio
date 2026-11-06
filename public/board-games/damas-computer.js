import {damaActions,damaBoardAfter} from './damas.js?v=cs-mode-3';

function value(board,turn){
 let score=0;board.forEach((piece,i)=>{if(!piece)return;const side=Math.sign(piece),y=Math.floor(i/8),advance=side===1?7-y:y;score+=side*((Math.abs(piece)===2?330:100+advance*5)+(3.5-Math.abs(i%8-3.5))*2);});return score*turn;
}
const order=moves=>moves.sort((a,b)=>(b.captures.length*100+Math.abs(b.piece)*20)-(a.captures.length*100+Math.abs(a.piece)*20));
export function chooseDamaMove(board,turn,{maxDepth=3,nodeLimit=2500,timeLimit=75,now=()=>performance.now()}={}){
 const moves=order(damaActions(board,turn));if(!moves.length)return null;
 const deadline=now()+timeLimit;let nodes=0,stopped=false,best=moves[0];
 function search(position,side,depth,alpha,beta,ply){
  if(++nodes>nodeLimit||now()>deadline){stopped=true;return value(position,side);}
  const legal=order(damaActions(position,side));if(!legal.length)return -100000+ply;if(depth===0)return value(position,side);
  let result=-Infinity;
  for(const move of legal){const score=-search(damaBoardAfter(position,move),-side,depth-1,-beta,-alpha,ply+1);result=Math.max(result,score);alpha=Math.max(alpha,score);if(alpha>=beta||stopped)break;}
  return result;
 }
 for(let depth=1;depth<=maxDepth;depth++){
  let candidate=best,score=-Infinity;
  for(const move of moves){const next=-search(damaBoardAfter(board,move),-turn,depth-1,-Infinity,Infinity,1);if(next>score){score=next;candidate=move;}if(stopped)break;}
  if(stopped)break;best=candidate;
 }
 return best;
}

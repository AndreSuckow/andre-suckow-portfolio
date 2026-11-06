export const MORRIS_POINTS=[[0,0],[3,0],[6,0],[1,1],[3,1],[5,1],[2,2],[3,2],[4,2],[0,3],[1,3],[2,3],[4,3],[5,3],[6,3],[2,4],[3,4],[4,4],[1,5],[3,5],[5,5],[0,6],[3,6],[6,6]];
export const MORRIS_MILLS=[[0,1,2],[3,4,5],[6,7,8],[9,10,11],[12,13,14],[15,16,17],[18,19,20],[21,22,23],[0,9,21],[3,10,18],[6,11,15],[1,4,7],[16,19,22],[8,12,17],[5,13,20],[2,14,23]];
export const MORRIS_EDGES=MORRIS_MILLS.flatMap(([a,b,c])=>[[a,b],[b,c]]);
export function createTrilha(){
 const state={kind:'trilha',board:Array(24).fill(0),turn:1,placed:[0,0],capture:false,winner:null,draw:null,history:[]},seen=new Map();
 const slot=side=>side===1?0:1,count=side=>state.board.filter(p=>p===side).length;
 const inMill=(at,side)=>MORRIS_MILLS.some(line=>line.includes(at)&&line.every(i=>state.board[i]===side));
 function legalActions(){
  if(state.winner!==null||state.draw)return [];
  const empty=state.board.flatMap((p,i)=>p===0?[i]:[]);
  if(state.capture){const enemy=state.board.flatMap((p,i)=>p===-state.turn?[i]:[]),outside=enemy.filter(i=>!inMill(i,-state.turn));return (outside.length?outside:enemy).map(at=>({type:'capture',at}));}
  if(state.placed[slot(state.turn)]<9)return empty.map(to=>({type:'place',to}));
  if(state.placed.some(n=>n<9))return [];
  return state.board.flatMap((piece,from)=>piece!==state.turn?[]:empty.filter(to=>count(state.turn)===3||MORRIS_EDGES.some(([a,b])=>a===from&&b===to||b===from&&a===to)).map(to=>({type:'move',from,to})));
 }
 function finish(){
  state.capture=false;state.turn*=-1;
  if(state.placed.every(n=>n===9)&&(count(state.turn)<3||!legalActions().length)){state.winner=-state.turn;return;}
  const key=JSON.stringify([state.board,state.turn,state.placed]);seen.set(key,(seen.get(key)||0)+1);
  if(seen.get(key)>=3)state.draw='Repetição tripla da posição';
 }
 return {state,legalActions,
  play(action){const move=legalActions().find(a=>JSON.stringify(a)===JSON.stringify(action));if(!move)return {ok:false,message:'Jogada inválida. Escolha uma posição destacada.'};
   if(move.type==='capture'){state.board[move.at]=0;state.history.push(`Removida a peça na posição ${move.at+1}`);finish();return {ok:true};}
   if(move.type==='place')state.placed[slot(state.turn)]++;else state.board[move.from]=0;
   state.board[move.to]=state.turn;state.history.push(`${state.turn===1?'Brancas':'Pretas'}: ${move.type==='place'?'colocação':`${move.from+1} →`} ${move.to+1}`);
   if(inMill(move.to,state.turn)&&state.board.includes(-state.turn))state.capture=true;else finish();return {ok:true};
  }
 };
}

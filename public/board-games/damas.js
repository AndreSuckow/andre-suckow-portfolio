const dirs=[[-1,-1],[1,-1],[-1,1],[1,1]],xy=i=>[i%8,Math.floor(i/8)],inside=(x,y)=>x>=0&&x<8&&y>=0&&y<8,index=(x,y)=>y*8+x;
const crowned=(piece,y)=>Math.abs(piece)===2||piece>0&&y===0||piece<0&&y===7?Math.sign(piece)*2:piece;
// The supplied manual explicitly promotes during a capture sequence.
export function damaActions(board,turn){
 const captures=[];
 function capture(from,at,piece,current,path=[],taken=[]){
  const [x,y]=xy(at);let advanced=false;
  for(const [dx,dy]of dirs){
   let nx=x+dx,ny=y+dy;
   if(Math.abs(piece)===2)while(inside(nx,ny)&&current[index(nx,ny)]===0){nx+=dx;ny+=dy;}
   if(!inside(nx,ny)||Math.sign(current[index(nx,ny)])!==-turn)continue;
   const victim=index(nx,ny);nx+=dx;ny+=dy;
   while(inside(nx,ny)&&current[index(nx,ny)]===0){
    const to=index(nx,ny),next=[...current],promoted=crowned(piece,ny);next[at]=0;next[victim]=0;next[to]=promoted;
    capture(from,to,promoted,next,[...path,to],[...taken,victim]);advanced=true;
    if(Math.abs(piece)!==2)break;nx+=dx;ny+=dy;
   }
  }
  if(!advanced&&taken.length)captures.push({type:'move',from,to:at,path,captures:taken,piece});
 }
 board.forEach((piece,i)=>{if(Math.sign(piece)===turn)capture(i,i,piece,board);});
 if(captures.length){const maximum=Math.max(...captures.map(a=>a.captures.length));return captures.filter(a=>a.captures.length===maximum);}
 const moves=[];
 board.forEach((piece,from)=>{
  if(Math.sign(piece)!==turn)return;const [x,y]=xy(from);
  for(const [dx,dy]of dirs){if(Math.abs(piece)===1&&dy!==-turn)continue;let nx=x+dx,ny=y+dy;
   while(inside(nx,ny)&&board[index(nx,ny)]===0){const to=index(nx,ny);moves.push({type:'move',from,to,path:[to],captures:[],piece:crowned(piece,ny)});if(Math.abs(piece)===1)break;nx+=dx;ny+=dy;}
  }
 });return moves;
}
export function damaBoardAfter(board,move){
 const next=[...board];next[move.from]=0;for(const at of move.captures)next[at]=0;next[move.to]=move.piece;return next;
}
export function createDamas(){
 const state={kind:'damas',board:Array.from({length:64},(_,i)=>{const[x,y]=xy(i);return (x+y)%2===1?(y<3?-1:y>4?1:0):0;}),turn:1,winner:null,draw:null,history:[]},seen=new Map();
 const legalActions=()=>state.winner===null&&!state.draw?damaActions(state.board,state.turn):[];
 seen.set(JSON.stringify([state.board,state.turn]),1);
 return {state,legalActions,
  play(action){const move=legalActions().find(a=>a.from===action.from&&a.to===action.to&&JSON.stringify(a.path)===JSON.stringify(action.path));if(!move)return {ok:false,message:'Jogada inválida. A maior sequência de captura é obrigatória quando disponível.'};
   state.board=damaBoardAfter(state.board,move);
   const square=i=>String.fromCharCode(97+i%8)+(8-Math.floor(i/8));state.history.push(`${state.turn===1?'Brancas':'Pretas'}: ${[move.from,...move.path].map(square).join(' → ')}${move.captures.length?` · ${move.captures.length} captura(s)`:''}`);
   state.turn*=-1;if(!legalActions().length)state.winner=-state.turn;
   const key=JSON.stringify([state.board,state.turn]);seen.set(key,(seen.get(key)||0)+1);if(seen.get(key)>=3)state.draw='Repetição tripla da posição';return {ok:true};
  }
 };
}

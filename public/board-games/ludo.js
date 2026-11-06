export const LUDO_COLORS=['Vermelho','Verde','Amarelo','Azul'];
export const LUDO_SAFE=[0,8,13,21,26,34,39,47];
export const LUDO_TRACK=[[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]];
export const LUDO_HOMES=[[[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],[[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],[[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],[[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]]];
export function ludoPoint(player,pawn,progress){
 if(progress<0){const bases=[[[2,2],[4,2],[2,4],[4,4]],[[2,10],[4,10],[2,12],[4,12]],[[10,10],[12,10],[10,12],[12,12]],[[10,2],[12,2],[10,4],[12,4]]];return bases[player][pawn];}
 return progress<52?LUDO_TRACK[(player*13+progress)%52]:LUDO_HOMES[player][progress-52];
}
export function createLudo({players=4,random=()=>{const a=new Uint32Array(1);let n;do{crypto.getRandomValues(a);n=a[0];}while(n>=4294967292);return n%6+1;}}={}){
 if(![2,3,4].includes(players))throw Error('Ludo permite de 2 a 4 jogadores.');
 const state={kind:'ludo',positions:Array.from({length:players},()=>Array(4).fill(-1)),turn:0,die:null,winner:null,draw:null,history:[]};
 const legalActions=()=>state.winner!==null||state.draw||state.die===null?[]:state.positions[state.turn].flatMap((progress,pawn)=>{const to=progress<0?(state.die===6?0:-2):progress+state.die;return to>=0&&to<=57&&progress!==57?[{type:'move',pawn,to}]:[];});
 const advance=()=>{if(state.die!==6)state.turn=(state.turn+1)%players;state.die=null;};
 return {state,legalActions,
  roll(){if(state.die!==null||state.winner!==null||state.draw)return {ok:false,message:'Movimente uma peça antes de lançar novamente.'};const die=random();if(!Number.isInteger(die)||die<1||die>6)throw Error('Dado inválido');state.die=die;state.history.push(`${LUDO_COLORS[state.turn]}: dado ${die}`);if(!legalActions().length){state.history.push('Sem movimentos legais.');advance();}return {ok:true,die};},
  play(action){const move=legalActions().find(a=>a.pawn===action.pawn&&a.to===action.to);if(!move)return {ok:false,message:'Movimento inválido. Use uma das peças destacadas.'};
   state.positions[state.turn][move.pawn]=move.to;
   if(move.to<52){const square=(state.turn*13+move.to)%52;if(!LUDO_SAFE.includes(square))state.positions.forEach((pawns,player)=>{if(player!==state.turn)pawns.forEach((progress,pawn)=>{if(progress>=0&&progress<52&&(player*13+progress)%52===square){pawns[pawn]=-1;state.history.push(`${LUDO_COLORS[player]}: peça ${pawn+1} voltou à base.`);}});});}
   state.history.push(`${LUDO_COLORS[state.turn]}: peça ${move.pawn+1} → ${move.to===57?'chegada':move.to+1}`);
   if(state.positions[state.turn].every(p=>p===57))state.winner=state.turn;else advance();return {ok:true};
  }
 };
}

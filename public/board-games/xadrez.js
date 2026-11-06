import {Chess} from '../vendor/chess.js';
const coordinate=i=>String.fromCharCode(97+i%8)+(8-Math.floor(i/8)),position=s=>(8-Number(s[1]))*8+s.charCodeAt(0)-97;
export function createXadrez(){
 const chess=new Chess(),state={kind:'xadrez',board:[],turn:1,winner:null,draw:null,history:[],check:false};
 function sync(){state.board=chess.board().flat();state.turn=chess.turn()==='w'?1:-1;state.check=chess.isCheck();state.winner=chess.isCheckmate()?-state.turn:null;state.draw=chess.isStalemate()?'Afogamento':chess.isInsufficientMaterial()?'Material insuficiente':chess.isThreefoldRepetition()?'Repetição tripla':chess.isDrawByFiftyMoves()?'50 lances sem captura ou movimento de peão':null;state.history=chess.history();}
 sync();
 const legalActions=()=>state.winner!==null||state.draw?[]:chess.moves({verbose:true}).map(m=>({type:'move',from:position(m.from),to:position(m.to),promotion:m.promotion??null,san:m.san}));
 return {state,legalActions,
  play(action){const move=legalActions().find(m=>m.from===action.from&&m.to===action.to&&(!m.promotion||m.promotion===(action.promotion||'q')));if(!move)return {ok:false,message:state.check?'Seu rei está em xeque. Escolha uma resposta legal.':'Movimento ilegal para esta peça.'};
   chess.move({from:coordinate(move.from),to:coordinate(move.to),...(move.promotion?{promotion:move.promotion}:{})});sync();return {ok:true};
  }
 };
}

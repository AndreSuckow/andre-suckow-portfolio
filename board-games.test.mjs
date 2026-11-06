import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrilha} from './public/board-games/trilha.js';
import {createDamas,damaActions} from './public/board-games/damas.js';
import {createLudo} from './public/board-games/ludo.js';
import {createXadrez} from './public/board-games/xadrez.js';
const unchanged=(game,action)=>{const before=JSON.stringify(game.state);assert.equal(game.play(action).ok,false);assert.equal(JSON.stringify(game.state),before);};

test('Trilha alternates placements, rejects occupied positions and grants a removal after a mill',()=>{
 const game=createTrilha();for(const to of [0,3,1,4,2])assert(game.play({type:'place',to}).ok);
 assert.equal(game.state.turn,1);assert(game.state.capture);assert(game.legalActions().every(a=>a.type==='capture'));
 unchanged(game,{type:'place',to:5});assert(game.play({type:'capture',at:3}).ok);assert.equal(game.state.board[3],0);assert.equal(game.state.turn,-1);
 unchanged(game,{type:'place',to:0});
});
test('Trilha protects mills, allows flight only with three pieces and detects a win after removal',()=>{
 const game=createTrilha(),s=game.state;s.placed=[9,9];s.board.fill(0);[0,1,2,6].forEach(i=>s.board[i]=1);[9,10,11,5].forEach(i=>s.board[i]=-1);s.capture=true;
 assert.deepEqual(game.legalActions(),[{type:'capture',at:5}]);unchanged(game,{type:'capture',at:9});
 s.capture=false;s.board.fill(0);[0,3,6].forEach(i=>s.board[i]=1);[2,5,8].forEach(i=>s.board[i]=-1);
 assert(game.legalActions().some(a=>a.from===0&&a.to===23));s.board[9]=1;assert(!game.legalActions().some(a=>a.from===0&&a.to===23));
 s.board.fill(0);[0,1,2].forEach(i=>s.board[i]=1);[3,4,5].forEach(i=>s.board[i]=-1);s.capture=true;
 assert(game.play({type:'capture',at:3}).ok);assert.equal(s.winner,1);assert.equal(game.legalActions().length,0);
});
test('Dama initializes 12 pieces per side and rejects illegal and out-of-turn moves without changing state',()=>{
 const game=createDamas();assert.equal(game.state.board.filter(p=>p===1).length,12);assert.equal(game.state.board.filter(p=>p===-1).length,12);
 unchanged(game,{from:1,to:17,path:[17]});const move=game.legalActions()[0];assert(game.play(move).ok);assert.equal(game.state.turn,-1);
});
test('Dama requires the longest capture sequence, including backward captures',()=>{
 const board=Array(64).fill(0);board[42]=1;board[59]=1;board[35]=-1;board[21]=-1;board[50]=-1;
 const actions=damaActions(board,1);assert(actions.length>0);assert(actions.every(a=>a.from===42&&a.captures.length===2));
 const backwards=Array(64).fill(0);backwards[26]=1;backwards[35]=-1;assert(damaActions(backwards,1).some(a=>a.to===44&&a.captures.length===1));
});
test('Dama follows the manual promotion during capture and allows long-range king landings',()=>{
 const board=Array(64).fill(0);board[18]=1;board[11]=-1;board[22]=-1;
 assert(damaActions(board,1).some(a=>a.path[0]===4&&a.to===31&&a.piece===2&&a.captures.length===2));
 const king=Array(64).fill(0);king[56]=2;king[35]=-1;const moves=damaActions(king,1);assert(moves.length>1);assert(moves.every(a=>a.captures.length===1));
});
test('Ludo requires six to leave the base, grants another roll and captures only outside safe squares',()=>{
 const rolls=[6,5],game=createLudo({players:2,random:()=>rolls.shift()});assert(game.roll().ok);assert.equal(game.legalActions().length,4);
 assert(game.play(game.legalActions()[0]).ok);assert.equal(game.state.turn,0);assert.equal(game.state.die,null);
 game.state.positions[1][0]=44;game.roll();assert(game.play(game.legalActions()[0]).ok);assert.equal(game.state.positions[1][0],-1);assert.equal(game.state.turn,1);
 game.state.turn=0;game.state.die=5;game.state.positions[0][0]=3;game.state.positions[1][0]=47;
 assert(game.play(game.legalActions().find(a=>a.pawn===0)).ok);assert.equal(game.state.positions[1][0],47);
});
test('Ludo passes when no move exists, requires an exact finish and recognizes all four arrivals',()=>{
 const game=createLudo({players:2,random:()=>1});game.roll();assert.equal(game.state.turn,1);assert.equal(game.state.die,null);
 game.state.turn=0;game.state.positions[0]=[57,57,57,56];game.state.die=2;assert.equal(game.legalActions().length,0);unchanged(game,{type:'move',pawn:3,to:58});
 game.state.die=1;assert(game.play(game.legalActions()[0]).ok);assert.equal(game.state.winner,0);assert.equal(game.legalActions().length,0);
});
const index=s=>(8-Number(s[1]))*8+s.charCodeAt(0)-97;
const chessMove=(game,from,to,promotion)=>{const move=game.legalActions().find(a=>a.from===index(from)&&a.to===index(to)&&(!a.promotion||a.promotion===(promotion||'q')));assert(move,`Expected legal move ${from}-${to}`);assert(game.play(move).ok);};
test('Xadrez rejects illegal moves, enforces check and detects Fool’s Mate',()=>{
 const game=createXadrez();assert.equal(game.legalActions().length,20);unchanged(game,{from:index('e2'),to:index('e5')});
 for(const [a,b]of [['f2','f3'],['e7','e5'],['g2','g4'],['d8','h4']])chessMove(game,a,b);
 assert.equal(game.state.winner,-1);assert(game.state.check);assert.equal(game.legalActions().length,0);
});
test('Xadrez validates castling, en passant, underpromotion and repetition draws',()=>{
 const castle=createXadrez();for(const [a,b]of [['e2','e4'],['e7','e5'],['g1','f3'],['b8','c6'],['f1','e2'],['g8','f6'],['e1','g1']])chessMove(castle,a,b);assert.equal(castle.state.board[index('f1')].type,'r');
 const ep=createXadrez();for(const [a,b]of [['e2','e4'],['a7','a6'],['e4','e5'],['d7','d5'],['e5','d6']])chessMove(ep,a,b);assert.equal(ep.state.board[index('d5')],null);
 const promote=createXadrez();for(const [a,b,p]of [['a2','a4'],['h7','h5'],['a4','a5'],['h5','h4'],['a5','a6'],['h4','h3'],['a6','b7'],['h3','g2'],['b7','a8','n']])chessMove(promote,a,b,p);assert.equal(promote.state.board[0].type,'n');
 const repeat=createXadrez();for(let i=0;i<2;i++)for(const [a,b]of [['g1','f3'],['g8','f6'],['f3','g1'],['f6','g8']])chessMove(repeat,a,b);assert.match(repeat.state.draw,/Repetição/);
});

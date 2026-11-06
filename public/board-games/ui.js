import {createTrilha,MORRIS_POINTS,MORRIS_EDGES} from './trilha.js?v=cs-mode-3';
import {createDamas} from './damas.js?v=cs-mode-3';
import {createLudo,LUDO_COLORS,LUDO_SAFE,LUDO_TRACK,LUDO_HOMES,ludoPoint} from './ludo.js?v=cs-mode-3';
import {createXadrez} from './xadrez.js?v=cs-mode-3';
import {createDamaOpponent} from './damas-opponent.js?v=cs-mode-3';
import {snapshotTrilhaAction,animateTrilhaAction} from './trilha-motion.js?v=cs-mode-3';

const names={trilha:'Trilha',damas:'Dama',ludo:'Ludo',xadrez:'Xadrez'};
const descriptions={trilha:'Forme linhas de três e capture as peças adversárias.',damas:'Capture pelas diagonais e transforme suas peças em damas.',ludo:'Lance o dado e leve suas quatro peças até a chegada.',xadrez:'Proteja seu rei e encontre o xeque-mate.'};
const rules={trilha:'Duas pessoas, nove peças por lado. Coloque todas as peças antes de mover. Uma trilha permite uma remoção; peças em trilhas ficam protegidas se houver outra opção. Com três peças, é permitido voar. Empate na terceira repetição da posição.',damas:'Regras do arquivo fornecido: 8×8, 12 peças por lado. Captura obrigatória e prioridade à maior sequência. Peças comuns capturam para trás; damas percorrem diagonais. Conforme o arquivo, a promoção pode ocorrer durante uma captura, que prossegue como dama. Clique no destino final da sequência. Empate na terceira repetição.',ludo:'De duas a quatro pessoas neste aparelho. Tire seis para sair da base e jogar novamente. Não há punição por três seis seguidos nem barreiras. Inícios e estrelas são seguros. Capturas devolvem a peça à base. A chegada exige número exato. Vence quem terminar com as quatro peças.',xadrez:'Xadrez entre duas pessoas: roque, en passant, promoção a dama, torre, bispo ou cavalo, xeque e mate. Afogamento, material insuficiente, terceira repetição e 50 lances sem captura ou movimento de peão são reconhecidos automaticamente.'};
const palette=['#bd443e','#397358','#bf9227','#3e6ba0'];
const square=i=>String.fromCharCode(97+i%8)+(8-Math.floor(i/8));
let dialog,game,kind,selected=null,routeChoices=[],previousFocus,previousOverflow='',ludoPlayers=4;
const sessions=new Map();
let checkerCanvas;
const computer=createDamaOpponent();
let damasMode='human',trilhaMotion=null,computerFocus=null;
function computerTurn(){return kind==='damas'&&damasMode==='computer'&&game?.state.turn===-1&&game.state.winner===null&&!game.state.draw;}
function cancelComputer(){computer.cancel();computerFocus=null;}
function scheduleComputer(){
 if(!computerTurn()||!dialog.open||document.hidden||!dialog.querySelector('[data-reset-confirm]').hidden||computer.pending)return;
 const session=game,revision=game.state.history.length;
 computer.request(game.state.board,-1,move=>{
  if(!dialog.open||kind!=='damas'||game!==session||game.state.history.length!==revision||!computerTurn())return;
  const restore=document.activeElement===dialog.querySelector('[data-board-status]'),focus=computerFocus;computerFocus=null;
  if(move)play(move);else message('O computador não tem jogadas disponíveis.');
  if(restore&&focus!==null)dialog.querySelector(`[data-cell="${focus}"]`)?.focus({preventScroll:true});
 });
}
function makeGame(type){return ({trilha:createTrilha,damas:createDamas,xadrez:createXadrez,ludo:()=>createLudo({players:ludoPlayers})})[type]();}
function turnName(state){return state.kind==='ludo'?LUDO_COLORS[state.turn]:state.turn===1?'Brancas':'Pretas';}
function ensureDialog(){
 if(dialog)return;
 dialog=document.createElement('dialog');dialog.className='dialog board-game-dialog';dialog.id='board-games-dialog';dialog.setAttribute('aria-labelledby','board-games-title');dialog.setAttribute('data-lenis-prevent','');
 dialog.innerHTML=`<div class="board-game-shell"><header class="board-game-header"><div><p class="eyebrow">Sobre a cama verde · Jogos de tabuleiro</p><h2 id="board-games-title">Escolha um jogo</h2></div><button type="button" class="btn" data-board-action="close" aria-label="Fechar jogos de tabuleiro">Fechar</button></header><section data-board-picker><p>Escolha um jogo. Na Dama, jogue contra outra pessoa ou contra o computador. As partidas ficam guardadas enquanto esta página estiver aberta.</p><div class="board-game-picker">${Object.entries(names).map(([id,name])=>`<button type="button" data-board-game="${id}"><strong>${name}</strong><span>${descriptions[id]}</span></button>`).join('')}</div><label class="board-player-count">Jogadores no Ludo <select data-ludo-players><option value="2">2 jogadores</option><option value="3">3 jogadores</option><option value="4" selected>4 jogadores</option></select></label></section><section data-board-play hidden><div class="board-game-toolbar"><button type="button" class="btn" data-board-action="menu">Trocar jogo</button><button type="button" class="btn" data-board-action="restart">Reiniciar</button><label data-damas-opponent hidden>Adversário <select data-damas-mode><option value="human">Humano (neste aparelho)</option><option value="computer">Computador</option></select></label><label data-promotion-label hidden>Promover para <select data-promotion><option value="q">Dama</option><option value="r">Torre</option><option value="b">Bispo</option><option value="n">Cavalo</option></select></label></div><p class="board-game-turn" data-board-turn></p><p data-board-status role="status" aria-live="polite" tabindex="-1"></p><p data-damas-help class="damas-opponent-help" hidden></p><div class="board-reset-confirm" data-reset-confirm hidden><p>Reiniciar esta partida e apagar seu histórico?</p><button type="button" class="btn" data-board-action="confirm-reset">Reiniciar partida</button><button type="button" class="btn" data-board-action="cancel-reset">Continuar partida</button></div><div class="board-game-content"><div data-board-surface></div><aside class="board-game-sidebar"><p class="checker-credit" data-checker-credit hidden>Peças: <a href="https://sketchfab.com/3d-models/pedra-jogo-de-damas-b38d9483544741238067199fce8852ec" target="_blank" rel="noopener">Pedra (Jogo de Damas)</a>, de Guilherme Tognetti · CC BY 4.0. Versão branca adaptada.</p><div data-ludo-actions hidden><button type="button" class="btn btn--primary" data-board-action="roll">Lançar dado</button><p data-die-result></p><div data-ludo-moves></div></div><div data-route-choices></div><details open><summary>Histórico de jogadas</summary><ol data-board-history></ol></details><details><summary>Regras desta partida</summary><p data-board-rules></p></details></aside></div></section></div>`;
 document.body.append(dialog);
 dialog.querySelector('[data-damas-mode]').addEventListener('change',event=>{cancelComputer();damasMode=event.target.value;selected=null;routeChoices=[];if(kind==='damas')render();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelComputer();else if(dialog.open)scheduleComputer();});
 dialog.addEventListener('click',click);
 dialog.addEventListener('close',()=>{cancelComputer();trilhaMotion?.cancel();document.body.style.overflow=previousOverflow;if(!document.querySelector('dialog[open]'))document.dispatchEvent(new CustomEvent('resume:skill-close'));(previousFocus?.isConnected?previousFocus:document.getElementById('stage-canvas'))?.focus({preventScroll:true});});
 dialog.querySelector('[data-ludo-players]').addEventListener('change',event=>{ludoPlayers=Number(event.target.value);});
}
export function openBoardGames(){
 ensureDialog();if(dialog.open||document.querySelector('dialog[open]'))return;
 previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;document.dispatchEvent(new CustomEvent('resume:skill-open'));document.body.style.overflow='hidden';showPicker();dialog.showModal();dialog.querySelector('[data-board-game]').focus({preventScroll:true});
}
function showPicker(){cancelComputer();trilhaMotion?.cancel();dialog.querySelector('[data-board-picker]').hidden=false;dialog.querySelector('[data-board-play]').hidden=true;dialog.querySelector('#board-games-title').textContent='Escolha um jogo';}
function start(type,restart=false){
 cancelComputer();trilhaMotion?.cancel();
 kind=type;if(restart||!sessions.has(type))sessions.set(type,makeGame(type));game=sessions.get(type);selected=null;routeChoices=[];
 dialog.querySelector('[data-board-picker]').hidden=true;dialog.querySelector('[data-board-play]').hidden=false;dialog.querySelector('[data-reset-confirm]').hidden=true;
 dialog.querySelector('#board-games-title').textContent=names[type];dialog.querySelector('[data-board-rules]').textContent=rules[type];dialog.querySelector('[data-promotion-label]').hidden=type!=='xadrez';render();
 if(type==='ludo'&&game.state.positions.length!==ludoPlayers){dialog.querySelector('[data-reset-confirm]').hidden=false;message('Alterar a quantidade de jogadores reinicia o Ludo. Confirme ou continue a partida atual.');}
 dialog.querySelector('[data-board-surface] button:not(:disabled)')?.focus({preventScroll:true});
}
function message(value){dialog.querySelector('[data-board-status]').textContent=value;}
function play(action){
 trilhaMotion?.cancel();const surface=dialog.querySelector('[data-board-surface]'),before=kind==='trilha'?snapshotTrilhaAction(surface,action):null;
 const result=game.play(action);if(!result.ok){message(result.message);return;}selected=null;routeChoices=[];render();
 if(kind==='trilha')trilhaMotion=animateTrilhaAction(surface,action,before);
}
function chooseCell(at){
 if(trilhaMotion?.active)return;
 if(computerTurn()){message('Computador pensando… Aguarde a sua vez.');return;}
 const state=game.state,actions=game.legalActions();
 if(state.winner!==null||state.draw){message('Partida encerrada. Reinicie ou escolha outro jogo.');return;}
 if(kind==='trilha'&&(state.capture||actions[0]?.type==='place')){const action=actions.find(a=>(state.capture?a.at:a.to)===at);if(action)play(action);else message(state.capture?'Remova uma peça adversária destacada. Peças em trilhas estão protegidas quando há outra opção.':'Coloque uma peça em uma posição vazia.');return;}
 const moves=actions.filter(a=>a.from===selected&&a.to===at);
 if(moves.length){
  if(kind==='xadrez'){const promotion=dialog.querySelector('[data-promotion]').value;play(moves.find(a=>!a.promotion||a.promotion===promotion)||moves[0]);}
  else if(moves.length>1){routeChoices=moves;render();message('Escolha a sequência de captura que deseja executar.');}
  else play(moves[0]);return;
 }
 const piece=state.board[at],own=kind==='xadrez'?piece?.color===(state.turn===1?'w':'b'):Math.sign(piece)===state.turn;
 if(own&&actions.some(a=>a.from===at)){selected=at;routeChoices=[];render();message(kind==='damas'&&actions.some(a=>a.captures?.length)?'Captura obrigatória: escolha um destino destacado.':'Escolha um destino destacado.');}
 else message('Selecione uma peça do jogador da vez que tenha movimentos legais.');
}
function click(event){
 const target=event.target.closest('button');if(!target||!dialog.contains(target))return;
 if(target.dataset.boardGame){start(target.dataset.boardGame);return;}
 if(target.dataset.cell!==undefined){chooseCell(Number(target.dataset.cell));return;}
 if(target.dataset.ludoPawn!==undefined){const move=game.legalActions().find(a=>a.pawn===Number(target.dataset.ludoPawn));if(move)play(move);return;}
 if(target.dataset.route!==undefined){play(routeChoices[Number(target.dataset.route)]);return;}
 switch(target.dataset.boardAction){
  case 'close':dialog.close();break;
  case 'menu':showPicker();dialog.querySelector('[data-board-game]').focus({preventScroll:true});break;
  case 'restart':cancelComputer();trilhaMotion?.cancel();dialog.querySelector('[data-reset-confirm]').hidden=false;dialog.querySelector('[data-board-action="cancel-reset"]').focus();break;
  case 'cancel-reset':if(kind==='ludo'){ludoPlayers=game.state.positions.length;dialog.querySelector('[data-ludo-players]').value=String(ludoPlayers);}dialog.querySelector('[data-reset-confirm]').hidden=true;dialog.querySelector('[data-board-action="restart"]').focus();scheduleComputer();break;
  case 'confirm-reset':start(kind,true);break;
  case 'roll':{const result=game.roll();render();if(!result.ok)message(result.message);break;}
 }
}
function render(){
 const state=game.state,actions=game.legalActions(),surface=dialog.querySelector('[data-board-surface]'),focused=document.activeElement?.dataset.cell;
 const over=state.winner!==null||state.draw;
 const winner=kind==='ludo'?LUDO_COLORS[state.winner]:state.winner===1?'Brancas':'Pretas';
 dialog.querySelector('[data-board-turn]').textContent=state.winner!==null?`${winner} ${kind==='ludo'?'venceu':'venceram'}!`:state.draw?`Empate · ${state.draw}`:`Vez de ${turnName(state)}${state.check?' · Xeque!':''}`;
 message(over?'Escolha outro jogo ou reinicie para uma nova partida.':kind==='trilha'?(state.capture?'Trilha formada! Remova uma peça adversária destacada.':state.placed.some(n=>n<9)?`Colocação · brancas ${state.placed[0]}/9 · pretas ${state.placed[1]}/9`:'Selecione uma peça e seu destino. Com três peças, você pode voar.'):kind==='ludo'?'Lance o dado e escolha uma peça destacada.':kind==='damas'&&actions.some(a=>a.captures.length)?'Captura obrigatória: execute a maior sequência destacada.':'Selecione uma peça e um destino destacado.');
 if(kind==='ludo')renderLudo(surface,actions);else renderGrid(surface,actions);
 dialog.querySelector('[data-checker-credit]').hidden=kind!=='damas';
 dialog.querySelector('[data-damas-opponent]').hidden=kind!=='damas';dialog.querySelector('[data-damas-help]').hidden=kind!=='damas';
 dialog.querySelector('[data-damas-help]').textContent=damasMode==='computer'?'Você joga com as brancas; o computador joga com as pretas.':'Duas pessoas jogam neste aparelho, alternando os turnos.';
 if(computerTurn()){
  dialog.querySelector('[data-board-turn]').textContent='Vez do computador · Pretas';message('Computador pensando… Aguarde a sua vez.');
  surface.querySelectorAll('button').forEach(button=>{button.disabled=true});surface.firstElementChild?.setAttribute('aria-busy','true');
  if(focused!==undefined){computerFocus=focused;dialog.querySelector('[data-board-status]').focus({preventScroll:true});}
 }else if(focused!==undefined)surface.querySelector(`[data-cell="${focused}"]`)?.focus({preventScroll:true});
 dialog.querySelector('[data-ludo-actions]').hidden=kind!=='ludo';
 if(kind==='ludo'){
  dialog.querySelector('[data-board-action="roll"]').disabled=over||state.die!==null;
  dialog.querySelector('[data-die-result]').textContent=state.die===null?'Dado pronto para lançar.':`Dado: ${state.die}. Escolha a peça.`;
  const choices=dialog.querySelector('[data-ludo-moves]');choices.replaceChildren();
  for(const action of actions){const button=document.createElement('button');button.type='button';button.className='btn';button.dataset.ludoPawn=action.pawn;button.textContent=`Mover peça ${action.pawn+1}`;choices.append(button);}
 }
 const history=dialog.querySelector('[data-board-history]');history.closest('details').hidden=kind!=='xadrez';history.replaceChildren();for(const move of state.history){const li=document.createElement('li');li.textContent=move;history.append(li);}
 const routes=dialog.querySelector('[data-route-choices]');routes.replaceChildren();routeChoices.forEach((move,i)=>{const button=document.createElement('button');button.type='button';button.className='btn';button.dataset.route=i;button.textContent=[move.from,...move.path].map(square).join(' → ');routes.append(button);});
 scheduleComputer();
}
function renderGrid(surface,actions){
 const state=game.state,trilha=kind==='trilha',board=document.createElement('div');board.className=trilha?'morris-board':'classic-board';board.setAttribute('role','group');board.setAttribute('aria-label',`Tabuleiro de ${names[kind]}`);
 if(trilha){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 700 700');svg.setAttribute('aria-hidden','true');for(const[a,b]of MORRIS_EDGES){const line=document.createElementNS(ns,'line');for(const [prefix,i]of [['1',a],['2',b]]){line.setAttribute('x'+prefix,50+MORRIS_POINTS[i][0]*100);line.setAttribute('y'+prefix,50+MORRIS_POINTS[i][1]*100);}svg.append(line);}board.append(svg);}
 state.board.forEach((piece,at)=>{
  const legal=actions.some(a=>a.type==='capture'?a.at===at:a.type==='place'?a.to===at:a.from===selected&&a.to===at),button=document.createElement('button');button.type='button';button.dataset.cell=at;
  button.className=`board-cell ${!trilha&&(at%8+Math.floor(at/8))%2?'dark':'light'}${legal?' legal':''}${selected===at?' selected':''}`;
  if(trilha){button.style.left=(50+MORRIS_POINTS[at][0]*100)/7+'%';button.style.top=(50+MORRIS_POINTS[at][1]*100)/7+'%';}
  const label=trilha?`Posição ${at+1}`:square(at);
  if(kind==='xadrez'&&piece){const glyphs={w:{k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'},b:{k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'}},pieceNames={k:'rei',q:'dama',r:'torre',b:'bispo',n:'cavalo',p:'peão'};const span=document.createElement('span');span.className='chess-piece '+(piece.color==='w'?'piece-white':'piece-black');span.textContent=glyphs[piece.color][piece.type];span.setAttribute('aria-hidden','true');button.append(span);button.setAttribute('aria-label',`${label}, ${pieceNames[piece.type]} ${piece.color==='w'?'branco':'preto'}${legal?', destino permitido':''}`);}
  else{button.setAttribute('aria-label',`${label}, ${piece?(piece>0?'peça branca':'peça preta'):'vazia'}${Math.abs(piece)===2?', dama':''}${legal?', jogada permitida':''}`);if(piece){const span=document.createElement('span');span.className='board-disc '+(piece>0?'disc-white':'disc-black');span.textContent=Math.abs(piece)===2?'D':'';span.setAttribute('aria-hidden','true');button.append(span);}else if(trilha){const span=document.createElement('span');span.className='morris-number';span.textContent=at+1;button.append(span);}}
  button.setAttribute('aria-pressed',String(selected===at));board.append(button);
 });surface.replaceChildren(board);
 if(kind==='damas'){
  checkerCanvas??=document.createElement('canvas');checkerCanvas.className='checker-model-canvas';checkerCanvas.setAttribute('aria-hidden','true');board.append(checkerCanvas);
  if(checkerCanvas.dataset.ready==='true')board.dataset.checkerReady='true';
  document.dispatchEvent(new CustomEvent('board:checkers-render',{detail:{canvas:checkerCanvas,board:[...state.board]}}));
  for(const [at,piece] of state.board.entries())if(Math.abs(piece)===2){const mark=document.createElement('span');mark.className='checker-crown';mark.textContent='D';mark.setAttribute('aria-hidden','true');board.querySelector('[data-cell="'+at+'"]').append(mark);}
 }
}
function renderLudo(surface,actions){
 const board=document.createElement('div');board.className='ludo-board';board.setAttribute('role','group');board.setAttribute('aria-label','Tabuleiro de Ludo');
 for(let player=0;player<4;player++){const base=document.createElement('div');base.className='ludo-base ludo-base-'+player;base.style.setProperty('--ludo-color',palette[player]);board.append(base);}
 const tile=(x,y,color,label='')=>{const span=document.createElement('span');span.className='ludo-tile';span.style.left=x/15*100+'%';span.style.top=y/15*100+'%';if(color)span.style.background=color;span.textContent=label;board.append(span);};
 LUDO_TRACK.forEach(([x,y],i)=>tile(x,y,i%13===0?palette[Math.floor(i/13)]:null,LUDO_SAFE.includes(i)?'★':''));LUDO_HOMES.forEach((lane,player)=>lane.forEach(([x,y])=>tile(x,y,palette[player])));
 const stacks=new Map();game.state.positions.forEach((pawns,player)=>pawns.forEach((progress,pawn)=>{const [x,y]=ludoPoint(player,pawn,progress),key=x+','+y,offset=stacks.get(key)||0;stacks.set(key,offset+1);const button=document.createElement('button');button.type='button';button.className='ludo-pawn';button.style.left=(x+.5)/15*100+'%';button.style.top=(y+.5)/15*100+'%';button.style.marginLeft=(offset%2)*8+'px';button.style.marginTop=-Math.floor(offset/2)*7+'px';button.style.setProperty('--ludo-color',palette[player]);button.textContent=pawn+1;button.setAttribute('aria-label',`${LUDO_COLORS[player]}, peça ${pawn+1}, ${progress<0?'na base':progress===57?'na chegada':'casa '+(progress+1)}`);const legal=player===game.state.turn&&actions.some(a=>a.pawn===pawn);button.disabled=!legal;if(legal){button.dataset.ludoPawn=pawn;button.classList.add('legal');}board.append(button);}));surface.replaceChildren(board);
}

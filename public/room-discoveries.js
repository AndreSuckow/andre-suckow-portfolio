import "./game-access.js?v=cs-mode-3";
import "./discman-player.js?v=cs-mode-3";
const dialog=document.getElementById('games-notebook');
const posterGames=JSON.parse(document.getElementById('poster-games')?.textContent||'[]');
const touchControls=matchMedia('(max-width: 1000px), (pointer: coarse)');
const discmanTouchHint='Arraste o aparelho para girar. Use os botões grandes do painel para abrir ou fechar a tampa, retroceder, ouvir e pausar. A barra ajusta o volume.';
function syncTouchControls(){dialog.dataset.touchControls=String(touchControls.matches);const hint=dialog.querySelector('[data-model-controls-hint]');hint.textContent=touchControls.matches?'Arraste para girar. Use os controles para tocar.':'● Pontos âmbar: clique para usar o aparelho';if(dialog.open&&dialog.dataset.object==='discman')dialog.querySelector('#notebook-description').textContent=touchControls.matches?discmanTouchHint:objects.discman.hint;}
const drawerFocus=document.querySelector('[data-drawer-focus]');
let previousFocus=null,previousOverflow='',opening=false,activeObject='notebook';
const objects={notebook:{title:'Meu caderno de jogos',hint:'Segure e arraste o caderno para girar. Use a roda do mouse ou dois dedos para aproximar.',label:'Caderno de jogos'},bible:{title:'Bíblia Sagrada',hint:'Segure e arraste para girar a Bíblia. Para ler, use o link abaixo.',label:'Bíblia Sagrada'},pokedex:{title:'Pokédex',hint:'Segure e arraste a Pokédex para examinar os detalhes.',label:'Pokédex'},family:{title:'Quadro da família',hint:'Segure e arraste o quadro para girar. Fotografia aplicada ao modelo.',label:'Quadro da família'}};
objects.discman={title:'Sony Discman D150',hint:'Os pontos âmbar indicam controles clicáveis no aparelho: OPEN abre ou fecha a tampa; Retroceder, Ouvir e Pausar controlam a música. Arraste a rodinha para os lados; a barra abaixo indica o volume. Com o aparelho focado, use O para ouvir, P para pausar, R para retroceder e A para abrir ou fechar a tampa.',label:'Sony Discman D150'};
for(const game of posterGames)objects[game.id]={title:game.title,hint:'Arraste o pôster para girar. Amplie para ver a arte ou escolha Jogar.',label:'Pôster de '+game.title};
syncTouchControls();touchControls.addEventListener?.('change',syncTouchControls);
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function openNotebook(kind='notebook'){
 if(!objects[kind])return;
 if(opening||dialog.open||document.querySelector('dialog[open]'))return;
 activeObject=kind;opening=true;dialog.querySelector('[data-discman-player]').hidden=kind!=='discman';dialog.querySelector('[data-discman-credit]').hidden=kind!=='discman';dialog.querySelector('[data-family-credit]').hidden=kind!=='family';dialog.querySelector('[data-bible-credit]').hidden=kind!=='bible';dialog.querySelector('[data-pokedex-credit]').hidden=kind!=='pokedex';
 const game=posterGames.find(item=>item.id===kind);dialog.querySelector('[data-poster-actions]').hidden=!game;
 if(game){dialog.querySelector('[data-poster-game-title]').textContent=game.gameTitle;dialog.querySelector('[data-poster-play]').setAttribute('aria-label','Jogar '+game.gameTitle);dialog.querySelector('[data-game-provider]').textContent='Jogo via '+game.provider;dialog.querySelector('[data-rom-options]').open=false;}
 const item=objects[kind];dialog.querySelector('#notebook-title').textContent=item.title;dialog.querySelector('#notebook-description').textContent=kind==='discman'&&touchControls.matches?discmanTouchHint:item.hint;dialog.querySelector('[data-notebook-canvas]').setAttribute('aria-label',item.label+' em 3D. Arraste ou use as setas para girar. Mais e menos ajustam o zoom; Home reposiciona.');dialog.querySelector('.notebook-inspector__text').hidden=kind!=='notebook';dialog.querySelector('[data-room-bible]').hidden=kind!=='bible';dialog.querySelector('.notebook-inspector__error').hidden=true;dialog.dataset.object=kind;
 dialog.querySelector('.eyebrow').textContent={notebook:'Super Nintendo · Minhas aventuras',bible:'Leitura e fé',pokedex:'Coleção de jogos',family:'Memórias de família',discman:'Minha trilha sonora'}[kind];
 dialog.querySelector('.notebook-inspector__tools').setAttribute('aria-label','Zoom de '+item.label);
 if(game)dialog.querySelector('.eyebrow').textContent='Na parede do quarto · '+game.title;
 const actions={in:'Ampliar',out:'Reduzir'};
 dialog.querySelectorAll('[data-notebook-view]').forEach(button=>{const name=game?(button.dataset.notebookView==='in'?'Maximizar':'Diminuir'):actions[button.dataset.notebookView];button.setAttribute('aria-label',name+': '+item.label);button.querySelector('small').textContent=name;});
 previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;
 document.dispatchEvent(new CustomEvent('resume:skill-open'));
 document.body.style.overflow='hidden';
 if(kind==='notebook'||kind==='discman'){
  drawerFocus.hidden=false;drawerFocus.dataset.phase='opening';
  document.dispatchEvent(new CustomEvent('room:drawer',{detail:kind==='discman'?{open:true,kind}:true}));
 }else setTimeout(showInspector,reduced()?0:150);
}
function showInspector(){
  if(!opening)return;
  const kind=activeObject;
  opening=false;dialog.showModal();
  drawerFocus.hidden=true;delete drawerFocus.dataset.phase;
  document.dispatchEvent(new CustomEvent('room:notebook-view',{detail:kind}));
  const canvas=dialog.querySelector('[data-notebook-canvas]');
  if(canvas.dataset.ready!=='true'){dialog.dataset.viewer='unavailable';if(kind==='notebook')dialog.querySelector('.notebook-inspector__text').open=true;dialog.querySelector('.notebook-inspector__error').hidden=false;}
  dialog.querySelector('[data-notebook-close]').focus({preventScroll:true});
}
document.addEventListener('room:drawer-focus',event=>{drawerFocus.style.setProperty('--drawer-x',event.detail.x+'px');drawerFocus.style.setProperty('--drawer-y',event.detail.y+'px');});
document.addEventListener('room:drawer-opened',()=>{if(opening&&['notebook','discman'].includes(activeObject))drawerFocus.dataset.phase='fading';});
document.addEventListener('room:drawer-ready',()=>{if(opening&&['notebook','discman'].includes(activeObject))showInspector();});
function cancelOpening(){
 if(!opening)return;
 opening=false;drawerFocus.hidden=true;delete drawerFocus.dataset.phase;
 document.dispatchEvent(new CustomEvent('room:drawer',{detail:activeObject==='discman'?{open:false,kind:'discman'}:false}));
 document.body.style.overflow=previousOverflow;
 document.dispatchEvent(new CustomEvent('resume:skill-close'));
 previousFocus?.focus({preventScroll:true});
}
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&opening){event.preventDefault();cancelOpening();}},{capture:true});
let boardModule;
async function showBoardGames(){try{boardModule??=import('./board-games/ui.js?v=cs-mode-3');const {openBoardGames}=await boardModule;await openBoardGames();}catch(error){boardModule=null;console.warn('Board games unavailable',error);document.getElementById('announcer').textContent='N?o foi poss?vel abrir os jogos. Clique novamente para tentar.';}}
document.addEventListener('room:discover',event=>{
 if(event.detail==='board'){showBoardGames();return;}
 openNotebook(event.detail);
});
document.querySelector('[data-room-board]')?.addEventListener('click',showBoardGames);
document.querySelector('[data-room-notebook]').addEventListener('click',()=>openNotebook());
document.querySelectorAll('[data-room-inspect]').forEach(button=>button.addEventListener('click',()=>openNotebook(button.dataset.roomInspect)));
dialog.querySelector('[data-notebook-close]').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{
 document.dispatchEvent(new CustomEvent('room:notebook-view',{detail:false}));
 document.body.style.overflow=previousOverflow;
 if(['notebook','discman'].includes(activeObject))document.dispatchEvent(new CustomEvent('room:drawer',{detail:activeObject==='discman'?{open:false,kind:'discman'}:false}));
 if(!document.querySelector('dialog[open]'))document.dispatchEvent(new CustomEvent('resume:skill-close'));
 (previousFocus?.isConnected?previousFocus:document.getElementById('stage-canvas'))?.focus({preventScroll:true});
});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
new MutationObserver(()=>{if(document.documentElement.dataset.mode!=='3d')cancelOpening();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-mode']});

// Keyboard access highlights the same physical objects without revealing a menu.
for(const trigger of document.querySelectorAll('.room-object-access button')){
 trigger.addEventListener('focus',()=>document.dispatchEvent(new CustomEvent('room:focus',{detail:trigger.hasAttribute('data-room-board')?'board':trigger.dataset.roomInspect||'notebook'})));
 trigger.addEventListener('blur',()=>document.dispatchEvent(new CustomEvent('room:focus',{detail:null})));
}

// Require landscape for the mobile 3D TV; system rotation still needs browser support.
const root=document.documentElement;
const chapters=new Set(['boot','sobre','experiencia','projetos','skills','hobbies','contato']);
const smallTouch=()=>matchMedia('(pointer:coarse)').matches&&Math.min(innerWidth,innerHeight)<=600;
const landscape=()=>innerWidth>innerHeight;
const prompt=document.createElement('dialog');
prompt.className='dialog mobile-reading';
prompt.setAttribute('aria-labelledby','mobile-reading-title');
prompt.setAttribute('aria-describedby','mobile-reading-description');
prompt.setAttribute('data-lenis-prevent','');
prompt.innerHTML=`<div class="dialog__form"><span class="mobile-reading__phone" aria-hidden="true">↻</span><p class="eyebrow">Prepare-se para continuar</p><h2 id="mobile-reading-title" tabindex="-1">Gire o celular para continuar</h2><p id="mobile-reading-description">Esta parte da experiência 3D funciona na horizontal. Vire o aparelho de lado para liberar a TV e ler as informações.</p><p class="mobile-reading__status" role="status" aria-live="polite"></p><div class="mobile-reading__actions"><button type="button" class="btn btn--primary" data-reading-rotate>Girar para continuar</button></div></div>`;
document.body.append(prompt);
const rotate=prompt.querySelector('[data-reading-rotate]');
const canLock=typeof screen.orientation?.lock==='function'&&typeof root.requestFullscreen==='function';
rotate.hidden=!canLock;
let ownsFullscreen=false,ownsLock=false,rotating=false,wasLandscape=landscape();
function closePrompt(){if(prompt.open)prompt.close();}
function releaseOrientation(){
 if(ownsLock){try{screen.orientation.unlock();}catch{}ownsLock=false;}
 if(ownsFullscreen){ownsFullscreen=false;if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});}
}
function update(){
 if(document.getElementById('games-notebook')?.open||document.getElementById('board-games-dialog')?.open){closePrompt();return;}
 const reading=root.dataset.mode==='3d'&&chapters.has(root.dataset.chapter)&&smallTouch();
 root.toggleAttribute('data-mobile-reading',reading&&landscape());
 if(!reading||landscape()){
  closePrompt();
  if(!reading&&!rotating)releaseOrientation();
  return;
 }
 if(!prompt.open){
  prompt.showModal();
  document.dispatchEvent(new CustomEvent('resume:skill-open'));
  prompt.querySelector('h2').focus({preventScroll:true});
 }
}
prompt.addEventListener('close',()=>{
 const otherDialog=document.querySelector('dialog[open]');
 if(!otherDialog)document.dispatchEvent(new CustomEvent('resume:skill-close'));
 (otherDialog?.querySelector('[tabindex="-1"],button,input')||document.getElementById('stage-canvas'))?.focus({preventScroll:true});
 update();
});
prompt.addEventListener('cancel',event=>{event.preventDefault();});
rotate.addEventListener('click',async()=>{
 if(rotating)return;
 rotating=true;rotate.disabled=true;
 try{
  if(!document.fullscreenElement){await root.requestFullscreen();ownsFullscreen=true;}
  await screen.orientation.lock('landscape');ownsLock=true;
 }catch{
  releaseOrientation();
  prompt.querySelector('.mobile-reading__status').textContent='Este navegador não conseguiu girar a tela. Vire o aparelho manualmente e, se necessário, desative o bloqueio de rotação.';
 }finally{rotating=false;rotate.disabled=false;update();}
});
new MutationObserver(update).observe(root,{attributes:true,attributeFilter:['data-mode','data-chapter']});
document.addEventListener('close',event=>{if(event.target!==prompt)update();},true);
window.addEventListener('resize',()=>{
 const changed=wasLandscape!==landscape();wasLandscape=landscape();
 const chapter=root.dataset.chapter;
 update();
 if(changed&&smallTouch()&&root.dataset.mode==='3d'&&chapters.has(chapter)){
  requestAnimationFrame(()=>document.getElementById(chapter)?.scrollIntoView({block:'start',behavior:'instant'}));
 }
});
window.addEventListener('pagehide',releaseOrientation);
update();

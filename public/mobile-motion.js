// Mobile 2D motion is progressive: content remains usable without this module.
export function installMobileMotion({doc=document,win=window}={}) {
 const root=doc.documentElement;
 const mobile=win.matchMedia('(max-width:767px), (pointer:coarse) and (max-height:600px)');
 const reduced=win.matchMedia('(prefers-reduced-motion:reduce)');
 const animations=new Map(),viewers=[];let observer=null,frame=0,active=false;
 const background=doc.querySelector('.hero__bg img');
 const targets=[...doc.querySelectorAll('.tab__head,.about__portrait,.sheet>div,.about__bio,.about__mission,.about__actions,.phase__card,.resume-project,.certification-card,.resume-skills article,.resume-achievements article,.hobbies-grid article,.contact__intro,.resume-slots li,.outro__inner')];
 function show(element,visible,immediate=false) {
  const old=animations.get(element),from=win.getComputedStyle(element).opacity;
  old?.cancel();animations.delete(element);
  if(immediate){element.style.removeProperty('opacity');return;}
  const animation=element.animate(visible?[{opacity:from,translate:'0 12px'},{opacity:1,translate:'0 0'}]:[{opacity:from},{opacity:0}],{duration:visible?460:220,easing:visible?'cubic-bezier(.2,.7,.2,1)':'ease-out',fill:'forwards'});
  animations.set(element,animation);
 }
 function parallax(){
  frame=0;if(!active||!background)return;
  const hero=doc.querySelector('.hero'),rect=hero.getBoundingClientRect();
  if(rect.bottom>0&&rect.top<win.innerHeight)background.style.transform=`translate3d(0,${Math.max(-28,Math.min(68,-rect.top*.13))}px,0) scale(1.16)`;
 }
 const scroll=()=>{if(active&&!frame)frame=win.requestAnimationFrame(parallax);};
 function revealFocus(event){if(!active)return;for(const target of targets)if(target.contains(event.target))show(target,true,true);}
 function setupViewer(button){
  const cart=button.querySelector('.cart');if(!cart)return;
  const shell=doc.createElement('div');shell.className='mobile-cart-viewer';
  button.before(shell);shell.append(button);
  const back=doc.createElement('span');back.className='mobile-cart-back';back.setAttribute('aria-hidden','true');
  const title=button.querySelector('.cart__title')?.textContent||'AS-16';
  back.textContent=`AS-16 · ${title}`;cart.append(back);
  const controls=doc.createElement('div');controls.className='mobile-cart-controls';
  const rotate=doc.createElement('button');rotate.type='button';rotate.className='btn';rotate.textContent='Girar fita ↻';rotate.setAttribute('aria-label',`Girar fita ${title}`);
  const reset=doc.createElement('button');reset.type='button';reset.className='btn btn--ghost';reset.textContent='Restaurar';
  controls.append(rotate,reset);
  const hint=doc.createElement('p');hint.className='mobile-cart-hint';hint.textContent='Arraste para girar · toque na fita para abrir';
  shell.append(controls,hint);
  let angle=0,start=null,dragged=false,suppressUntil=0;
  const available=()=>root.dataset.mode==='2d'&&mobile.matches;
  function turn(value){angle=value;cart.style.setProperty('--cart-angle',`${angle}deg`);reset.disabled=angle===0;}
  turn(0);
  rotate.addEventListener('click',()=>turn(angle+45));reset.addEventListener('click',()=>turn(0));
  button.addEventListener('keydown',event=>{if(!available()||!['ArrowLeft','ArrowRight','Home'].includes(event.key))return;event.preventDefault();event.stopPropagation();turn(event.key==='Home'?0:angle+(event.key==='ArrowRight'?45:-45));});
  button.addEventListener('pointerdown',event=>{if(!available()||event.button!==0)return;start={x:event.clientX,y:event.clientY,angle,id:event.pointerId};dragged=false;});
  button.addEventListener('pointermove',event=>{
   if(!start||event.pointerId!==start.id)return;
   const dx=event.clientX-start.x,dy=event.clientY-start.y;
   if(!dragged&&Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){start=null;return;}
   if(!dragged&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)*1.25){dragged=true;button.setPointerCapture?.(event.pointerId);shell.dataset.dragging='';}
   if(dragged)turn(start.angle+dx*1.3);
  });
  const end=()=>{if(dragged)suppressUntil=Date.now()+500;start=null;dragged=false;delete shell.dataset.dragging;};
  button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);
  button.addEventListener('click',event=>{if(available()&&Date.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
  viewers.push({shell,button,cart,back,controls,hint,reset:()=>turn(0)});
 }
 doc.querySelectorAll('.resume-cart').forEach(setupViewer);
 function sync(){
  active=root.dataset.mode==='2d'&&mobile.matches&&!reduced.matches;
  observer?.disconnect();observer=null;
  for(const [target,animation] of animations){animation.cancel();target.style.removeProperty('opacity');}animations.clear();
  win.cancelAnimationFrame(frame);frame=0;
  root.toggleAttribute('data-mobile-motion',active);
  for(const viewer of viewers){viewer.controls.hidden=viewer.hint.hidden=!(root.dataset.mode==='2d'&&mobile.matches);if(!mobile.matches||root.dataset.mode!=='2d')viewer.reset();}
  if(!active){background?.style.removeProperty('transform');return;}
  if(win.IntersectionObserver&&typeof targets[0]?.animate==='function'){
   const header=doc.querySelector('.site-header')?.getBoundingClientRect().height||0;
   observer=new win.IntersectionObserver(entries=>{for(const entry of entries){if(entry.target.contains(doc.activeElement)){show(entry.target,true,true);continue;}show(entry.target,entry.isIntersecting);}},{rootMargin:`-${header}px 0px -12px 0px`,threshold:0});
   for(const target of targets)observer.observe(target);
  }
  parallax();
 }
 const mutations=new win.MutationObserver(sync);mutations.observe(root,{attributes:true,attributeFilter:['data-mode']});
 mobile.addEventListener('change',sync);reduced.addEventListener('change',sync);
 win.addEventListener('scroll',scroll,{passive:true});win.addEventListener('resize',scroll,{passive:true});
 doc.addEventListener('focusin',revealFocus);sync();
 return {sync,destroy(){active=false;observer?.disconnect();mutations.disconnect();mobile.removeEventListener('change',sync);reduced.removeEventListener('change',sync);win.removeEventListener('scroll',scroll);win.removeEventListener('resize',scroll);doc.removeEventListener('focusin',revealFocus);win.cancelAnimationFrame(frame);for(const animation of animations.values())animation.cancel();background?.style.removeProperty('transform');root.removeAttribute('data-mobile-motion');for(const v of viewers){v.shell.before(v.button);v.cart.style.removeProperty('--cart-angle');v.back.remove();v.shell.remove();}}};
}
if(typeof document!=='undefined')installMobileMotion();

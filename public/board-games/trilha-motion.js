export function snapshotTrilhaAction(surface,action){
 const at=action.type==='capture'?action.at:action.from,piece=at===undefined?null:surface.querySelector(`[data-cell="${at}"] .board-disc`);
 return piece?{element:piece.cloneNode(true),rect:piece.getBoundingClientRect()}:null;
}
export function animateTrilhaAction(surface,action,before){
 const board=surface.querySelector('.morris-board'),win=surface.ownerDocument.defaultView;
 const preference=win.matchMedia?.('(prefers-reduced-motion:reduce)');
 if(!board||preference?.matches||typeof board.animate!=='function')return null;
 const at=action.to??action.at,target=board.querySelector(`[data-cell="${at}"] .board-disc`),rect=target?.getBoundingClientRect()||before?.rect;
 const ghost=(before?.element||target)?.cloneNode(true);if(!ghost||!rect?.width)return null;
 const bounds=board.getBoundingClientRect(),origin=before?.rect||rect,hidden=target?.style.visibility||'',doc=surface.ownerDocument,restoreFocus=board.contains(doc.activeElement);
 ghost.classList.add('trilha-moving-piece');ghost.setAttribute('aria-hidden','true');
 Object.assign(ghost.style,{left:rect.left-bounds.left-board.clientLeft+'px',top:rect.top-bounds.top-board.clientTop+'px',width:rect.width+'px',height:rect.height+'px'});
 if(target)target.style.visibility='hidden';board.append(ghost);
 const buttons=[...board.querySelectorAll('button')].map(button=>[button,button.disabled]);buttons.forEach(([button])=>{button.disabled=true});board.setAttribute('aria-busy','true');
 const frames=action.type==='move'?[{transform:`translate(${origin.left-rect.left}px,${origin.top-rect.top}px)`},{transform:'translate(0,0)'}]:action.type==='capture'?[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.55)'}]:[{opacity:0,transform:'translateY(-14px) scale(.6)'},{opacity:1,transform:'translateY(0) scale(1)'}];
 let active=true;
 const cleanup=()=>{if(!active)return;active=false;ghost.remove();if(target)target.style.visibility=hidden;buttons.forEach(([button,disabled])=>{button.disabled=disabled});board.removeAttribute('aria-busy');win.removeEventListener('resize',cancel);preference?.removeEventListener?.('change',cancel);if(restoreFocus&&board.isConnected&&doc.activeElement===doc.body)board.querySelector(`[data-cell="${at}"]`)?.focus({preventScroll:true});};
 const animation=ghost.animate(frames,{duration:action.type==='move'?360:240,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'});
 function cancel(){animation.cancel();cleanup();}
 animation.finished.then(cleanup,cleanup);win.addEventListener('resize',cancel,{once:true});preference?.addEventListener?.('change',cancel);
 return {get active(){return active;},cancel};
}

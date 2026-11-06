const mobileQuery='(max-width:767px), (pointer:coarse) and (max-height:600px)';

export function installMobile2DGameAccess({doc=document,media=matchMedia(mobileQuery)}={}){
 const root=doc.documentElement;
 const blocked=()=>root.dataset.mode==='2d'&&media.matches;
 function sync(){
  const disabled=blocked();root.toggleAttribute('data-mobile-games-blocked',disabled);
  for(const gallery of doc.querySelectorAll('.poster-gallery'))gallery.toggleAttribute('inert',disabled);
  if(!disabled)return;
  const poster=doc.getElementById('games-notebook');
  if(poster?.open&&poster.dataset.object?.startsWith('poster-'))poster.close();
  const board=doc.getElementById('board-games-dialog');if(board?.open)board.close();
 }
 function guard(event){
  if(blocked()&&event.target.closest?.('.poster-gallery,[data-room-inspect^="poster-"],[data-room-board],[data-poster-play]')){event.preventDefault();event.stopImmediatePropagation();}
 }
 const observer=new doc.defaultView.MutationObserver(sync);observer.observe(root,{attributes:true,attributeFilter:['data-mode']});
 media.addEventListener?.('change',sync);doc.addEventListener('click',guard,true);sync();
 return {dispose(){observer.disconnect();media.removeEventListener?.('change',sync);doc.removeEventListener('click',guard,true);}};
}

if(typeof document!=='undefined')installMobile2DGameAccess();

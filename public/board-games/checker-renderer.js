// One transparent, on-demand canvas shares the room's Three.js runtime.
export const checkerModelURL=new URL('../models/tabuleiro/pedra_jogo_de_damas/scene.gltf?v=cs-mode-3',import.meta.url);
export function checkerPieces(board){
 return board.flatMap((piece,index)=>piece?[{index,x:index%8-3.5,z:Math.floor(index/8)-3.5,white:piece>0,king:Math.abs(piece)===2}]:[]);
}
export function createCheckerTemplate(T,source){
 const bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 const diameter=Math.max(size.x,size.z);if(!Number.isFinite(diameter)||diameter<=0)throw Error('Invalid checker model bounds');
 const templates=[],materials=[],geometries=new Set();
 for(const white of [false,true]){
  const root=new T.Group(),model=source.clone(true);model.position.sub(new T.Vector3(center.x,bounds.min.y,center.z));root.add(model);root.scale.setScalar(.72/diameter);
  const copies=new Map();model.traverse(mesh=>{if(!mesh.isMesh)return;geometries.add(mesh.geometry);mesh.castShadow=false;mesh.receiveShadow=false;
   const copy=material=>{if(!copies.has(material)){const next=material.clone();if(white)next.color.set('#f1eee6');next.transparent=false;next.opacity=1;copies.set(material,next);materials.push(next);}return copies.get(material);};
   mesh.material=Array.isArray(mesh.material)?mesh.material.map(copy):copy(mesh.material);
  });templates.push(root);
 }
 return {templates,height:size.y*.72/diameter,dispose(){materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());}};
}
export function installCheckerRenderer(T,{doc=document,win=window}={}){
 let view=null,loading=null,template=null,disposed=false;
 async function load(){
  if(template)return template;
  if(!loading)loading=new T.Loader().loadAsync(checkerModelURL.href).then(asset=>{
   const prepared=createCheckerTemplate(T,asset.scene);
   // Geometry is shared with the prepared clones; original materials are unused.
   const originals=new Set();asset.scene.traverse(mesh=>{if(mesh.isMesh)for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])originals.add(m);});originals.forEach(m=>m.dispose());
   if(disposed){prepared.dispose();return null;}template=prepared;return template;
  }).catch(error=>{loading=null;throw error;});
  return loading;
 }
 function create(canvas){
  const renderer=new T.Renderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});renderer.outputColorSpace=T.SRGB;renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(win.devicePixelRatio||1,2));
  const scene=new T.Scene(),pieces=new T.Group(),camera=new T.OrthographicCamera(-4,4,4,-4,.1,30);camera.position.set(0,10,0);camera.up.set(0,0,-1);camera.lookAt(0,0,0);scene.add(pieces);
  scene.add(new T.HemisphereLight(0xffffff,0x5a606b,.9));const key=new T.DirectionalLight(0xffffff,2.3);key.position.set(-3,7,-4);scene.add(key);
  const fill=new T.DirectionalLight(0xc7d9ff,.45);fill.position.set(4,5,3);scene.add(fill);
  let board=[],frame=0,lost=false;
  function draw(){
   frame=0;if(disposed||lost||!template||!canvas.isConnected)return;
   const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
   pieces.clear();
   for(const piece of checkerPieces(board)){
    const model=template.templates[Number(piece.white)].clone(true);model.position.set(piece.x,0,piece.z);pieces.add(model);
    if(piece.king){const crown=template.templates[Number(piece.white)].clone(true);crown.position.set(piece.x+.045,template.height*.86,piece.z-.045);pieces.add(crown);}
   }
   renderer.setSize(rect.width,rect.height,false);renderer.render(scene,camera);
   canvas.dataset.ready='true';if(canvas.parentElement)canvas.parentElement.dataset.checkerReady='true';
   canvas.dataset.pieces=String(checkerPieces(board).length);
  }
  const schedule=()=>{if(!frame)frame=win.requestAnimationFrame(draw);};
  const resize=new win.ResizeObserver(schedule);resize.observe(canvas);
  const contextLost=()=>{lost=true;delete canvas.dataset.ready;if(canvas.parentElement)delete canvas.parentElement.dataset.checkerReady;};
  const contextRestored=()=>{lost=false;schedule();};canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('webglcontextrestored',contextRestored);
  return {canvas,update(next){board=[...next];schedule();},dispose(){win.cancelAnimationFrame(frame);resize.disconnect();canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',contextRestored);pieces.clear();renderer.dispose();renderer.forceContextLoss();delete canvas.dataset.ready;}};
 }
 async function request(event){
  const {canvas,board}=event.detail||{};if(!canvas||!Array.isArray(board)||board.length!==64||disposed)return;
  try{if(!view||view.canvas!==canvas){view?.dispose();view=create(canvas);}view.update(board);await load();if(!disposed)view.update(latestBoard);}
  catch(error){console.warn('Peças 3D indisponíveis; mantendo as peças acessíveis.',error);}
 }
 let latestBoard=[];
 const onRequest=event=>{if(Array.isArray(event.detail?.board))latestBoard=[...event.detail.board];request(event);};
 doc.addEventListener('board:checkers-render',onRequest);
 return {dispose(){disposed=true;doc.removeEventListener('board:checkers-render',onRequest);view?.dispose();template?.dispose();}};
}

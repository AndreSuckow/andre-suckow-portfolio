import {createGameBoyModel} from './gameboy-model.js?v=cs-mode-3';
import {createDiscman} from "./discman.js?v=cs-mode-3";
import {interactionShake,automaticInteractionShake} from './interaction-motion.js?v=cs-mode-3';
import {createFamilyFrame} from "./family-frame.js?v=cs-mode-3";
import {createImportedProp,rememberPropAppearance,restorePropAppearance} from "./imported-props.js?v=cs-mode-3";
// Novo Quarto 3D — original geometry and textures inspired by André's room reference.
// The interactive TV and console retain their original world coordinates.
export function createNewRoom(T){
 const {Group,Mesh,BoxGeometry,PlaneGeometry,BufferGeometry,BufferAttribute,Material,CanvasTexture,SRGB}=T;
 const root=new Group();root.name='Novo Quarto 3D';
 const interactive=new Group();interactive.name='Room discoveries';const targets=[];
 function action(mesh,id,label){mesh.userData.roomAction={id,label};targets.push(mesh);return mesh;}
 const boxGeometry=new BoxGeometry(1,1,1),planeGeometry=new PlaneGeometry(1,1);
 const materials=new Map(),resources=[boxGeometry,planeGeometry];
 let seed=3421;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function texture(draw,width=512,height=512){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  draw(canvas.getContext('2d'),width,height);
  const map=new CanvasTexture(canvas);map.colorSpace=SRGB;map.anisotropy=4;resources.push(map);return map;
 }
 function material(color,map=null){
  const key=`${color}/${map?.uuid||''}`;if(materials.has(key))return materials.get(key);
  const value=new Material({color,map,roughness:.86,metalness:0});materials.set(key,value);return value;
 }
 const woodMap=texture((c,w,h)=>{
  c.fillStyle='#a49a80';c.fillRect(0,0,w,h);
  for(let i=0;i<1400;i++){const x=random()*w;c.strokeStyle=`rgba(${random()>.5?'43,27,12':'214,187,133'},${.04+random()*.14})`;c.lineWidth=.4+random()*1.8;c.beginPath();c.moveTo(x,0);for(let y=0;y<=h;y+=12)c.lineTo(x+Math.sin(y*.018+i)*(.5+random()*2.5),y);c.stroke();}
 });
 const oak=material('#ded6ba',woodMap),darkOak=material('#b0a080',woodMap),endWood=material('#685d46'),cream=material('#d9d5bd'),trim=material('#b7b39a'),gold=material('#8b6b34'),black=material('#25251e');
 function box(name,x,y,z,w,h,d,mat,parent=root){const mesh=new Mesh(boxGeometry,mat);mesh.name=name;mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function plane(name,x,y,z,w,h,mat,rotation=[0,0,0],parent=root){const mesh=new Mesh(planeGeometry,mat);mesh.name=name;mesh.position.set(x,y,z);mesh.scale.set(w,h,1);mesh.rotation.set(...rotation);mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function geometry(name,positions,uv,indices,mat,parent=root){const geo=new BufferGeometry();geo.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));geo.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));geo.setIndex(indices);geo.computeVertexNormals();resources.push(geo);const mesh=new Mesh(geo,mat);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function cylinder(name,x,y,z,radius,height,mat,segments=12,parent=root){
  const pos=[],uv=[],indices=[];
  for(let j=0;j<=1;j++)for(let i=0;i<=segments;i++){const angle=i/segments*Math.PI*2;pos.push(Math.cos(angle)*radius,(j-.5)*height,Math.sin(angle)*radius);uv.push(i/segments,j);}
  for(let i=0;i<segments;i++){const a=i,b=i+segments+1;indices.push(a,b,a+1,a+1,b,b+1);}
  for(const top of [false,true]){const center=pos.length/3;pos.push(0,(top?.5:-.5)*height,0);uv.push(.5,.5);const offset=top?segments+1:0;for(let i=0;i<segments;i++)indices.push(center,offset+(top?i+1:i),offset+(top?i:i+1));}
  const mesh=geometry(name,pos,uv,indices,mat,parent);mesh.position.set(x,y,z);return mesh;
 }
 function ellipsoid(name,x,y,z,rx,ry,rz,mat,parent=root){
  const pos=[],uv=[],indices=[],nx=20,ny=10;
  const round=value=>Math.sign(value)*Math.abs(value)**.55;
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const a=i/nx*Math.PI*2,b=j/ny*Math.PI;pos.push(round(Math.cos(a))*Math.sin(b)**.55*rx,round(Math.cos(b))*ry,round(Math.sin(a))*Math.sin(b)**.55*rz);uv.push(i/nx,j/ny);}
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;indices.push(a,a+1,b,a+1,b+1,b);}
  const mesh=geometry(name,pos,uv,indices,mat,parent);mesh.position.set(x,y,z);return mesh;
 }
 const floorMap=texture((c,w,h)=>{
  c.fillStyle='#463624';c.fillRect(0,0,w,h);const tile=64;
  for(let y=0;y<h;y+=tile)for(let x=0;x<w;x+=tile){
   const vertical=(x/tile+y/tile)%2===0;
   for(let i=0;i<4;i++){
    c.save();c.translate(x+tile/2,y+tile/2);if(vertical)c.rotate(Math.PI/2);
    c.fillStyle=['#826039','#a07b49','#b48c51','#947042'][Math.floor(random()*4)];c.fillRect(-31,-31+i*16,62,14);
    for(let n=0;n<8;n++){c.strokeStyle=n%2?'#ffffff12':'#1d160e2e';c.beginPath();c.moveTo(-28,-30+i*16+random()*12);c.lineTo(28,-30+i*16+random()*12);c.stroke();}c.restore();
   }
  }
 },1024,1024);
 box('Raised cutaway foundation',-.25,-.065,.37,3.85,.13,3.4,trim);
 plane('Parquet floor',-.25,.006,.37,3.72,3.28,material('#ffffff',floorMap),[-Math.PI/2,0,0]);
 box('Back wall',-.25,1.05,-1.31,3.85,2.1,.085,cream);
 // Four pieces leave a real opening in the right wall for the window.
 box('Right wall rear',1.64,1.05,-1.12,.085,2.1,.4,cream);
 box('Right wall front',1.64,1.05,1.15,.085,2.1,1.82,cream);
 box('Wall below window',1.64,.31,-.32,.085,.62,1.17,cream);
 box('Wall above window',1.64,1.91,-.32,.085,.38,1.17,cream);
 box('Rear skirting',-.25,.055,-1.252,3.76,.1,.035,endWood);
 box('Side skirting',1.585,.055,.37,.035,.1,3.25,endWood);
 // The desk top stays at y=.5, supporting the existing interactive models.
 box('Desk top',.18,.475,-.99,1.85,.05,.55,darkOak);
 box('Desk left side',-.72,.245,-1,.05,.46,.51,oak);
 box('Desk right side',1.08,.245,-1,.05,.46,.51,oak);
 box('Drawer pedestal',.73,.24,-1,.5,.44,.49,oak);
 for(let i=0;i<3;i++){
  if(i===0){box('Desk drawer',.73,.12+i*.13,-.743,.46,.12,.025,oak);box('Desk drawer handle',.73,.12+i*.13,-.723,.085,.012,.016,black);}
 }
 const drawer=new Group();drawer.name='First desk drawer';drawer.position.set(.73,.38,-.743);interactive.add(drawer);
 const front=box('Clickable top drawer',0,0,0,.46,.12,.025,oak,drawer);action(front,'notebook','Abrir gaveta: caderno de jogos');
 action(box('Top drawer handle',0,0,.02,.085,.012,.016,black,drawer),'notebook','Abrir gaveta: caderno de jogos');
 box('Drawer bottom',0,-.045,-.17,.43,.015,.33,darkOak,drawer);
 for(const x of [-.22,.22])box('Drawer side',x,-.015,-.17,.015,.08,.33,oak,drawer);
 const drawerNotebook=new Group();drawerNotebook.name='Notebook rising from drawer';drawer.add(drawerNotebook);
 box('Games notebook cover',0,-.027,-.12,.26,.015,.21,material('#344e78'),drawerNotebook);
 box('Notebook pages',0,-.017,-.12,.247,.009,.2,material('#f0e6c6'),drawerNotebook);
 const notebookMap=texture((c,w,h)=>{c.fillStyle='#141833';c.fillRect(0,0,w,h);c.strokeStyle='#4e5d8a';for(let y=115;y<h;y+=38){c.beginPath();c.moveTo(24,y);c.lineTo(w-24,y);c.stroke();c.strokeRect(28,y-24,15,15);}c.fillStyle='#ffb547';c.font='bold 42px monospace';c.fillText('MEUS JOGOS',32,80);c.strokeStyle='#aeb6c8';c.lineWidth=4;for(let x=24;x<w-10;x+=35){c.beginPath();c.ellipse(x,17,6,14,0,0,Math.PI*2);c.stroke();}},512,384);
 plane('Notebook in drawer',0,-.011,-.12,.246,.199,material('#ffffff',notebookMap),[-Math.PI/2,0,0],drawerNotebook);
 const musicDrawer=new Group();musicDrawer.name='Second desk drawer';musicDrawer.position.set(.73,.25,-.743);interactive.add(musicDrawer);
 box('Second drawer front',0,0,0,.46,.12,.025,oak,musicDrawer);box('Second drawer handle',0,0,.02,.085,.012,.016,black,musicDrawer);
 box('Second drawer bottom',0,-.045,-.17,.43,.015,.33,darkOak,musicDrawer);
 for(const x of [-.22,.22])box('Second drawer side',x,-.015,-.17,.015,.08,.33,oak,musicDrawer);
 const discman=createDiscman(T),discmanRestY=discman.root.userData.discmanModel==='sony-d150' ? .01 : -.012;discman.root.scale.setScalar(.78);discman.root.position.set(0,discmanRestY,-.15);musicDrawer.add(discman.root);
 // Wardrobe with inset panels, open center niche and suitcases above it.
 const wx=-1.45,wz=-1.02;
 box('Wardrobe back',wx,.85,-1.26,1.05,1.64,.035,darkOak);
 for(const side of [-1,1]){
  box('Wardrobe side',wx+side*.51,.85,wz,.035,1.64,.52,darkOak);
  box('Niche divider',wx+side*.18,.99,wz,.022,.78,.5,darkOak);
 }
 box('Wardrobe top',wx,1.69,wz,1.1,.055,.56,endWood);
 for(const side of [-1,1]){
  const x=wx+side*.35;
  box('Tall wardrobe door',x,.77,-.746,.325,1.38,.035,oak);
  box('Door inner panel',x,.77,-.724,.267,1.25,.008,darkOak);
  box('Wardrobe handle',x-side*.1,.8,-.704,.016,.12,.024,black);
 }
 box('Center niche shadow',wx,.97,-1.237,.32,.49,.01,material('#342b20'));
 box('Center niche base',wx,.72,-1,.36,.035,.5,oak);
 const bibleObject=new Group();bibleObject.name='Interactive Bible';interactive.add(bibleObject);
 const importedBible=T.bibleScene?createImportedProp(T,T.bibleScene,{id:'holy-bible',name:'Holy Bible · VHM777',span:.20}):null;
 if(importedBible){bibleObject.userData.importedProp='holy-bible';bibleObject.add(importedBible.root);bibleObject.position.set(wx+.01,0,-.86);bibleObject.updateMatrixWorld(true);bibleObject.position.y=.74-new T.Box3().setFromObject(bibleObject).min.y;}
 else{
 const bible=box('Holy Bible',wx+.01,.755,-.86,.20,.035,.135,material('#302925'),interactive);action(bible,'bible','Ler a Bíblia Online · NTLH');
 const biblePages=box('Bible gilt pages',wx+.01,.755,-.79,.18,.02,.006,material('#d7c48c'),interactive);
 const bibleMap=texture((c,w,h)=>{c.fillStyle='#241b19';c.fillRect(0,0,w,h);c.strokeStyle='#c6a365';c.lineWidth=6;c.strokeRect(20,20,w-40,h-40);c.fillStyle='#d4b578';c.fillRect(w/2-7,50,14,130);c.fillRect(w/2-43,85,86,14);c.textAlign='center';c.font='bold 48px Georgia';c.fillText('BÍBLIA',w/2,255);c.font='28px Georgia';c.fillText('SAGRADA',w/2,300);},512,384);
 const bibleCover=action(plane('Bible gold cover',wx+.01,.773,-.86,.20,.135,material('#ffffff',bibleMap),[-Math.PI/2,0,0],interactive),'bible','Bíblia · examinar em 3D · NTLH');
 for(const part of [bible,biblePages,bibleCover])bibleObject.add(part);
 }
 // Open red pocket encyclopedia, beside the three cartridges.
 const pokedex=new Group();pokedex.name='Pokéagenda';pokedex.position.set(.76,.51,-.84);pokedex.rotation.y=-.14;interactive.add(pokedex);
 const importedPokedex=T.pokedexScene?createImportedProp(T,T.pokedexScene,{id:'pokedex',name:'Pokedex · chiara.dalfior',span:.22,rotation:[-Math.PI/2,-Math.PI/2,0]}):null;
 if(importedPokedex){pokedex.userData.importedProp='pokedex';pokedex.add(importedPokedex.root);pokedex.position.y=0;pokedex.updateMatrixWorld(true);pokedex.position.y=.502-new T.Box3().setFromObject(pokedex).min.y;}
 else{
 const deviceRed=material('#b92c36'),deviceDark=material('#342e39');
 box('Pokeagenda base',0,0,0,.18,.019,.13,deviceRed,pokedex);
 box('Pokeagenda lower screen',-.035,.011,0,.063,.003,.065,material('#87a99a'),pokedex);
 box('Pokeagenda directional vertical',.048,.012,.02,.012,.006,.043,deviceDark,pokedex);
 box('Pokeagenda directional horizontal',.048,.012,.02,.043,.006,.012,deviceDark,pokedex);
 const deviceLid=new Group();deviceLid.position.set(0,0,-.063);deviceLid.rotation.x=.83;pokedex.add(deviceLid);
 box('Pokeagenda lid',0,.005,-.06,.18,.016,.13,deviceRed,deviceLid);
 const dexMap=texture((c,w,h)=>{c.fillStyle='#a3c8b2';c.fillRect(0,0,w,h);c.fillStyle='#263f42';c.font='bold 42px monospace';c.fillText('POKÉAGENDA',22,54);c.font='26px monospace';c.fillText('Nº 025',22,96);c.fillStyle='#e2c74c';c.fillRect(154,107,90,92);c.fillRect(146,82,21,45);c.fillRect(226,82,21,45);c.fillStyle='#263f42';c.fillRect(170,131,10,10);c.fillRect(215,131,10,10);c.fillStyle='#ba4a3a';c.fillRect(160,155,17,13);c.fillRect(220,155,17,13);},400,256);
 plane('Pokeagenda display',0,.014,-.06,.143,.091,material('#ffffff',dexMap),[-Math.PI/2,0,0],deviceLid);
 cylinder('Pokeagenda blue lens',-.067,.015,-.048,.012,.006,material('#52b8dd'),12,pokedex);
 }
 // The illustration is only a fallback when the supplied portrait cannot load.
 const familyMap=T.familyFrameScene?null:texture((c,w,h)=>{c.fillStyle='#c5c8ac';c.fillRect(0,0,w,h);c.fillStyle='#8b9b7c';c.fillRect(0,h*.7,w,h*.3);for(const [x,y,size,shirt] of [[140,140,1,'#6c8b9a'],[280,135,1,'#c98b74'],[215,225,.65,'#d3b16c']]){c.fillStyle=shirt;c.fillRect(x-42*size,y+40*size,84*size,120*size);c.fillStyle='#c69972';c.beginPath();c.arc(x,y,40*size,0,Math.PI*2);c.fill();c.fillStyle='#514333';c.fillRect(x-40*size,y-32*size,80*size,20*size);}c.fillStyle='#f2e1bc';c.textAlign='center';c.font='bold 24px Georgia';c.fillText('FAMÍLIA',w/2,h-18);},420,380);
 const frame=new Group();frame.name='Family portrait frame';frame.position.set(.94,.64,-1.08);frame.rotation.set(-.12,-.35,0);interactive.add(frame);
 const importedFrame=T.familyFrameScene?createFamilyFrame(T):null;
 if(importedFrame){frame.add(importedFrame.root);frame.updateMatrixWorld(true);frame.position.y+=.505-new T.Box3().setFromObject(frame).min.y;}
 else{
 box('Family frame backing',0,0,0,.18,.23,.017,endWood,frame);
 plane('Family illustration',0,0,.009,.152,.20,material('#ffffff',familyMap),[0,0,0],frame);
 box('Family frame stand',0,-.07,-.06,.055,.14,.02,endWood,frame);
 box('Family frame foot',0,-.13,-.06,.075,.02,.08,endWood,frame);
 }
 // Pick the visible geometry itself, as with the game cartridges.
 const discoveries=new Map(),posterModels=new Map();let highlighted=null,focusStarted=0,lastCueTime=0,automatic=null,automaticStarted=0;
 function poster(id,name,image,x,y,z,width,rotation=[0,0,0]){
  if(!image)return;
  const map=new CanvasTexture(image);map.colorSpace=SRGB;map.anisotropy=Math.max(1,Math.min(16,T.maxAnisotropy??8));map.generateMipmaps=true;resources.push(map);
  const height=width*image.height/image.width,group=new Group();group.name=name;
  box(name+' paper',0,0,0,width,height,.003,material('#ede3cd'),group);
  // Keep the printed face clear of the backing's .0015m front plane.
  // The old .0001m gap lost depth precision while the camera moved.
  const ink=new T.BasicMaterial({color:'#ffffff',map,transparent:false,opacity:1,depthTest:true,depthWrite:true,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});resources.push(ink);
  const artwork=plane(name+' artwork',0,0,.0025,width,height,ink,[0,0,0],group);
  artwork.receiveShadow=false;artwork.castShadow=false;artwork.userData.posterArtwork=true;
  group.position.set(x,y,z);group.rotation.set(...rotation);interactive.add(group);
  discovery(id,group,name+' · examinar em 3D',0);posterModels.set(id,group);
 }
 function discovery(id,object,label,lift=.014){
  const surfaces=[];
  object.traverse(mesh=>{if(!mesh.isMesh)return;action(mesh,id,label);const clone=mat=>{const copy=mat.clone();rememberPropAppearance(copy);resources.push(copy);surfaces.push(copy);return copy;};mesh.material=Array.isArray(mesh.material)?mesh.material.map(clone):clone(mesh.material);});
  object.updateWorldMatrix(true,true);
  discoveries.set(id,{object,surfaces,restY:object.position.y,restZ:object.rotation.z,lift});
 }
 const gameboy=createGameBoyModel(T);interactive.add(gameboy.root);
 discovery('gameboy',gameboy.root,'Game Boy ? clique para jogar',.012);
 discovery('bible',bibleObject,'Bíblia · examinar em 3D · NTLH');
 discovery('pokedex',pokedex,'Pokédex · segurar e girar');
 discovery('family',frame,'Quadro da família · segurar e girar');
 discovery('notebook',drawer,'Abrir gaveta: caderno de jogos',0);
 discovery('discman',musicDrawer,'Abrir segunda gaveta: Discman',0);
 function highlight(id,reduced=false){
  if(id===highlighted)return;highlighted=id;focusStarted=lastCueTime;
  for(const [key,item] of discoveries){
   const active=key===id,y=item.restY+(active?item.lift:0);
   if(T.animate&&!reduced)T.animate(item.object.position,{y,duration:.2,ease:'power2.out',overwrite:'auto'});else item.object.position.y=y;
   for(const mat of item.surfaces){
    if(!mat.emissive)continue;if(active){mat.emissive.set('#ffb547');mat.emissiveIntensity=0;}else restorePropAppearance(mat);const intensity=active?.16:(mat.userData.roomAppearance?.intensity??0);
    if(T.animate&&!reduced)T.animate(mat,{emissiveIntensity:intensity,duration:.2,overwrite:'auto'});else mat.emissiveIntensity=intensity;
   }
  }
 }
 function updateInteractionCues(time,reduced=false){
  lastCueTime=time;
  for(const [key,item]of discoveries){
   const manual=key===highlighted,active=manual||key===automatic,shake=manual?interactionShake(time-focusStarted,reduced):key===automatic?automaticInteractionShake(time-automaticStarted,reduced):0;
   const strength=item.lift>0||key.startsWith('poster-')?1:item.object.userData.drawerOpen?0:.25;
   const rotation=item.restZ+shake*strength;if(item.object.rotation.z!==rotation){item.object.rotation.z=rotation;T.invalidateShadows?.();}
  }
 }
 for(let i=0;i<3;i++){
  box('Wardrobe center drawer',wx,.24+i*.155,-.736,.33,.142,.028,oak);
  box('Drawer pull',wx,.24+i*.155,-.713,.09,.014,.018,black);
 }
 for(let i=0;i<3;i++){
  box('Upper wardrobe door',wx+(i-1)*.35,1.47,-.741,.33,.36,.034,oak);
  box('Upper door pull',wx+(i-1)*.35+.09,1.33,-.71,.045,.013,.02,black);
 }
 const leather=material('#4a2d1e'),cardboard=material('#baa77f');
 box('Leather suitcase',wx-.2,1.79,-1,.56,.16,.35,leather);
 const lid=box('Leaning suitcase',wx-.13,1.99,-1.12,.52,.065,.36,leather);lid.rotation.x=.86;
 box('Suitcase brass handle',wx-.2,1.8,-.807,.13,.03,.035,gold);
 for(const side of [-1,1])box('Suitcase clasp',wx-.2+side*.19,1.8,-.806,.035,.035,.015,gold);
 box('Cardboard storage box',wx+.31,1.81,-1.03,.34,.22,.32,cardboard);
 const flap=box('Open cardboard flap',wx+.31,1.95,-1.12,.35,.012,.2,cardboard);flap.rotation.x=-.35;
 // Chair beside the desk, with its low curved-looking back made from wooden rails.
 const chair=new Group();chair.position.set(.03,0,-.35);chair.rotation.y=-.16;root.add(chair);
 box('Chair seat',0,.29,0,.3,.045,.3,oak,chair);
 for(const x of [-.115,.115])for(const z of [-.115,.115])box('Chair leg',x,.14,z,.035,.28,.035,darkOak,chair);
 for(const x of [-.115,.115])box('Chair upright',x,.49,-.12,.032,.4,.032,darkOak,chair);
 box('Chair back',0,.59,-.12,.27,.09,.03,oak,chair);
 function clothMap(plaid){return texture((c,w,h)=>{
  c.fillStyle=plaid?'#283d36':'#bca074';c.fillRect(0,0,w,h);
  for(let i=0;i<22000;i++){c.fillStyle=random()>.5?'#ffffff0e':'#0000000b';c.fillRect(random()*w,random()*h,1,2);}
  if(plaid){
   for(let i=-w;i<w*2;i+=76){c.fillStyle='#18302988';c.fillRect(i,0,20,h);c.fillRect(0,i,w,20);c.fillStyle='#d1ab51';c.fillRect(i+24,0,3,h);c.fillRect(0,i+24,w,3);c.fillStyle='#ddd1ae';c.fillRect(i+40,0,2,h);c.fillRect(0,i+40,w,2);}
  }else{
   c.strokeStyle='#eee2bf';c.lineWidth=2;
   for(let i=-h;i<w+h;i+=65){c.beginPath();c.moveTo(i,0);c.lineTo(i+h,h);c.stroke();c.beginPath();c.moveTo(i,0);c.lineTo(i-h,h);c.stroke();}
  }
 });}
 function bed(name,cx,cz,plaid){
  const parent=new Group();parent.name=name;parent.position.set(cx,0,cz);root.add(parent);
  const w=.88,l=1.68;
  box('Bed frame',0,.24,0,w,.11,l,darkOak,parent);
  box('Mattress',0,.36,0,w-.035,.17,l-.02,material('#d6d2b9'),parent);
  for(const x of [-w/2+.025,w/2-.025])for(const z of [-l/2,l/2]){
   box('Bed post',x,.32,z,.065,.64,.065,oak,parent);
   box('Post cap',x,.665,z,.09,.055,.09,darkOak,parent);
  }
  for(const z of [-l/2,l/2]){
   box('Headboard rail',0,.6,z,w,.055,.05,oak,parent);
   box('Headboard base',0,.36,z,w,.065,.05,darkOak,parent);
   for(let i=0;i<5;i++)box('Headboard spindle',-.31+i*.155,.48,z,.045,.24,.035,oak,parent);
  }
  const pos=[],uv=[],indices=[],nx=24,nz=36;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
   const x=(i/nx-.5)*(w+.16),z=(j/nz-.5)*(l-.1)+.11;
   const edge=Math.max(0,(Math.abs(x)-w*.38)/(.5*(w+.16)-w*.38));
   const front=Math.max(0,(z-l*.35)/(.6-l*.35+.3));
   const y=.465+Math.sin(x*26+z*9)*.014+Math.sin(z*18)*.007-edge*edge*.19-Math.max(0,front)*.04;
   pos.push(x,y,z);uv.push(i/nx,j/nz);
  }
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;indices.push(a,b,a+1,a+1,b,b+1);}
  geometry('Draped woven blanket',pos,uv,indices,material('#ffffff',clothMap(plaid)),parent);
  const pillow=ellipsoid('Soft pillow',0,.51,-.56,.32,.075,.18,material('#eee9d1'),parent);pillow.rotation.y=plaid?.07:-.12;
 }
 bed('Front plaid bed',-.91,1.05,true);
 bed('Window bed',.99,.54,false);
 // Lay the board face up on the clear middle of the green plaid bed.
 const board=new Group();board.name='Four-game wooden board';interactive.add(board);board.position.set(-.91,0,1.25);board.rotation.set(-Math.PI/2,0,-.08);
 let importedBoard=null;
 box('Board wooden back',0,0,0,.42,.42,.026,material('#785231'),board);
 const boardMap=texture((c,w,h)=>{
  c.fillStyle='#b58b51';c.fillRect(0,0,w,h);const cell=w*.76/8,start=w*.12;
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){c.fillStyle=(row+col)%2?'#35445b':'#ead6ae';c.fillRect(start+col*cell,start+row*cell,cell,cell);}
  for(const [x,y,color]of [[1,2,'#fbebcf'],[3,2,'#fbebcf'],[2,5,'#26324b'],[4,5,'#26324b']]){c.beginPath();c.arc(start+(x+.5)*cell,start+(y+.5)*cell,cell*.34,0,Math.PI*2);c.fillStyle=color;c.fill();}
  c.fillStyle='#33251d';c.font='bold 25px Arial';c.textAlign='center';c.fillText('JOGOS DE TABULEIRO',w/2,40);c.font='bold 18px Arial';c.fillText('TRILHA · DAMA · LUDO · XADREZ',w/2,h-25);
 },640,640);
 plane('Four game board surface',0,0,.014,.404,.404,material('#ffffff',boardMap),[0,0,0],board);
 for(const x of [-.205,.205])box('Board side rim',x,0,.02,.014,.42,.016,material('#9b6c3f'),board);
 for(const y of [-.205,.205])box('Board top bottom rim',0,y,.02,.42,.014,.016,material('#9b6c3f'),board);
 if(T.boardScene){
  const removed=[];T.boardScene.traverse(mesh=>{if(!mesh.isMesh)return;let belongs=false;for(let node=mesh;node;node=node.parent)if(/^Board[ _]Baked$/.test(node.name))belongs=true;if(!belongs)removed.push(mesh);});for(const mesh of removed)mesh.removeFromParent();
  importedBoard=createImportedProp(T,T.boardScene,{id:'board',name:'Supplied Ludo wooden board · Ahmad Taj',span:.42,rotation:[Math.PI/2,0,0]});
  [...board.children].forEach(child=>child.removeFromParent());board.add(importedBoard.root);
 }
 board.updateWorldMatrix(true,true);board.position.y+=.49-new T.Box3().setFromObject(board).min.y;
 discovery('board',board,'Tabuleiro · clique para escolher um jogo',.022);
 box('Bedside bench',.19,.24,1.65,.58,.065,.25,darkOak);
 for(const x of [-.02,.4])for(const z of [1.57,1.73])box('Bench leg',x,.12,z,.035,.24,.035,oak);
 // Window: dark glass, frames and wooden shutters on the right wall.
 const sky=material('#192323');
 plane('Night outside window',1.668,1.16,-.32,1.15,1.08,sky,[0,-Math.PI/2,0]);
 for(const z of [-.91,.27])box('Window jamb',1.57,1.16,z,.085,1.16,.055,darkOak);
 for(const y of [.59,1.74])box('Window lintel',1.57,y,-.32,.085,.055,1.23,darkOak);
 box('Window sill',1.52,.58,-.32,.23,.045,1.32,oak);
 for(const z of [-.72,.08]){
  box('Shutter frame',1.535,1.16,z,.05,1.03,.32,darkOak);
  for(let i=0;i<10;i++)box('Shutter slat',1.5,.71+i*.092,z,.027,.055,.26,oak);
 }
 box('Window center divider',1.515,1.16,-.32,.055,1.1,.035,oak);
 poster('poster-dkc3','Donkey Kong Country 3',T.posterImage,-.52,1.58,-1.256,.27);
 poster('poster-turtles','Tartarugas Ninja',T.turtlesPosterImage,-.13,1.64,-1.255,.3);
 // Small collection above the TV.
 box('TV floating shelf',-.17,1.246,-1.08,.91,.035,.26,darkOak);
 box('Shelf bracket left',-.51,1.19,-1.22,.025,.1,.03,endWood);
 box('Shelf bracket right',.17,1.19,-1.22,.025,.1,.03,endWood);
 const red=material('#b63f2a'),green=material('#5c9231'),blue=material('#305c83'),skin=material('#d2ab70');
 function figure(x,y,z,shirt){
  box('Collectible body',x,y+.035,z,.03,.045,.025,shirt);box('Collectible head',x,y+.07,z,.027,.027,.027,skin);
  box('Collectible cap',x,y+.088,z,.04,.012,.03,shirt);
  for(const sign of [-1,1])box('Collectible shoe',x+sign*.012,y+.008,z+.008,.019,.018,.03,blue);
 }
 figure(-.44,1.265,-1.04,green);figure(-.31,1.265,-1.04,red);
 cylinder('Green pipe stem',-.12,1.31,-1.08,.035,.09,green);cylinder('Green pipe rim',-.12,1.355,-1.08,.047,.025,green);
 function fan(x,y,z,side=false){
  const group=new Group();group.position.set(x,y,z);if(side)group.rotation.y=-Math.PI/2;root.add(group);
  cylinder('Fan base',0,.008,0,.035,.015,red,12,group);cylinder('Fan stand',0,.06,0,.008,.11,red,8,group);
  const head=cylinder('Fan circular housing',0,.135,0,.048,.018,red,16,group);head.rotation.x=Math.PI/2;
  for(let i=0;i<4;i++){const blade=box('Fan blade',0,.135,.014,.057,.009,.005,material('#e19464'),group);blade.rotation.z=i*Math.PI/2+.3;}
 }
 fan(.12,1.265,-1.08);
 // Right shelf, books and posters.
 box('Window-side shelf',1.45,1.01,.83,.29,.035,.86,darkOak);
 const bookColors=['#b34b30','#a39a6c','#44716c','#d2bc79','#544f47','#9b6548'];
 for(let i=0;i<10;i++){
  const z=.5+i*.053,h=.12+random()*.06;box('Book spine',1.42,1.03+h/2,z,.13,h,.043,material(bookColors[i%bookColors.length]));
  box('Book label',1.346,1.03+h*.7,z,.003,.008,.025,material('#d7c8a1'));
 }
 poster('poster-megaman','Mega Man X',T.megaManXPosterImage,1.586,1.47,.62,.32,[0,-Math.PI/2,0]);
 poster('poster-mario','Super Mario World',T.marioWorldPosterImage,1.585,1.47,1.09,.3,[0,-Math.PI/2,0]);
 fan(1.43,1.03,1.17,true);
 cylinder('Mug',-.57,.55,-.91,.032,.072,material('#c5c8ad'));
 // Soft contact shadows supplement the real directional shadows on smaller devices.
 const ao=texture((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'#00000066');g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(0,0,w,h);},128,128);
 const aoMat=new T.BasicMaterial({map:ao,transparent:true,depthWrite:false});resources.push(aoMat);
 for(const [x,z,w,l] of [[-.91,1.05,1.25,2.1],[.99,.54,1.25,2.1],[-1.45,-1,1.3,.9],[.2,-1,2.2,.8]])plane('Furniture contact shadow',x,.012,z,w,l,aoMat,[-Math.PI/2,0,0]);
 root.updateMatrixWorld(true);
 // Bake static transforms and batch matching surfaces to keep the room affordable on phones.
 const batches=new Map();let partCount=0;
 root.traverse(mesh=>{
  if(!mesh.isMesh)return;partCount++;
  const key=`${mesh.material.uuid}/${mesh.castShadow}/${mesh.receiveShadow}`;
  if(!batches.has(key))batches.set(key,{material:mesh.material,castShadow:mesh.castShadow,receiveShadow:mesh.receiveShadow,positions:[],normals:[],uvs:[]});
  const batch=batches.get(key),geo=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
  geo.applyMatrix4(mesh.matrixWorld);
  batch.positions.push(geo.attributes.position.array.slice());batch.normals.push(geo.attributes.normal.array.slice());batch.uvs.push(geo.attributes.uv.array.slice());geo.dispose();
 });
 root.clear();
 const join=chunks=>{const array=new Float32Array(chunks.reduce((sum,chunk)=>sum+chunk.length,0));let offset=0;for(const chunk of chunks){array.set(chunk,offset);offset+=chunk.length;}return array;};
 for(const batch of batches.values()){
  const geo=new BufferGeometry();geo.setAttribute('position',new BufferAttribute(join(batch.positions),3));geo.setAttribute('normal',new BufferAttribute(join(batch.normals),3));geo.setAttribute('uv',new BufferAttribute(join(batch.uvs),2));resources.push(geo);
  const mesh=new Mesh(geo,batch.material);mesh.name='Static room surfaces';mesh.castShadow=batch.castShadow;mesh.receiveShadow=batch.receiveShadow;root.add(mesh);
 }
 root.userData={version:'novo-quarto-3d',parts:partCount,batches:batches.size};
 root.add(interactive);
 function getInspectionModel(kind){
  if(posterModels.has(kind)){const model=posterModels.get(kind).clone(true);model.position.set(0,0,0);model.rotation.set(0,0,0);return model;}
  if(kind==='discman'){const model=discman.root.clone(true);model.rotation.x=discman.root.userData.discmanModel==='sony-d150' ? .9 : Math.PI/2;return model;}
  if(kind==='bible'){const model=bibleObject.clone(true);model.rotation.x=Math.PI/2;return model;}
  if(kind==='pokedex'){const model=pokedex.clone(true);model.rotation.set(.75,0,0);return model;}
  if(kind==='family'){const model=frame.clone(true);model.rotation.set(-.12,0,0);return model;}
  return null;
 }
 let drawerSequence=0;
 function setDrawerOpen(open,reduced=false,callbacks={}){
  drawer.userData.drawerOpen=open;
  const sequence=++drawerSequence,current=()=>sequence===drawerSequence;
  if(!T.animate||reduced){drawer.position.z=open?-.51:-.743;drawerNotebook.position.set(0,open?.115:0,open?.065:0);if(open){callbacks.opened?.();callbacks.ready?.();}return;}
  if(open){
   T.animate(drawer.position,{z:-.51,duration:.7,ease:'power3.inOut',overwrite:true,onComplete(){
    if(!current())return;callbacks.opened?.();
    T.animate(drawerNotebook.position,{y:.115,z:.065,duration:.38,ease:'power2.out',overwrite:true,onComplete(){if(current())callbacks.ready?.();}});
   }});
  }else{
   T.animate(drawerNotebook.position,{y:0,z:0,duration:.2,ease:'power2.in',overwrite:true,onComplete(){if(current())T.animate(drawer.position,{z:-.743,duration:.45,ease:'power2.inOut',overwrite:true});}});
  }
 }
 let musicSequence=0;
 function setDiscmanOpen(open,reduced=false,callbacks={}){
  musicDrawer.userData.drawerOpen=open;
  const seq=++musicSequence;
  const ready=()=>{if(seq!==musicSequence)return;callbacks.opened?.();if(T.animate&&!reduced)T.animate(discman.root.position,{y:.1,duration:.38,overwrite:true,onComplete:()=>{if(seq===musicSequence)callbacks.ready?.();}});else{discman.root.position.y=.1;callbacks.ready?.();}};
  if(T.animate&&!reduced)T.animate(musicDrawer.position,{z:open?-.51:-.743,duration:.7,ease:'power3.inOut',overwrite:true,onComplete:open?ready:undefined});else{musicDrawer.position.z=open?-.51:-.743;if(open)ready();}
  if(!open){if(T.animate&&!reduced)T.animate(discman.root.position,{y:discmanRestY,duration:.2,overwrite:true});else discman.root.position.y=discmanRestY;}
 }
 return {root,targets:[...new Set(targets)],get focused(){return highlighted;},interactionObjects(){return [...discoveries].map(([key,item])=>({key,root:item.object}));},automaticHighlight(id,time=lastCueTime){automatic=id;automaticStarted=time;},highlight,updateInteractionCues,setDiscmanOpen,getInspectionModel,setDrawerOpen,dispose(){drawerSequence++;musicSequence++;gameboy.dispose();discman.dispose();importedBoard?.dispose();importedFrame?.dispose();importedBible?.dispose();importedPokedex?.dispose();for(const value of materials.values())value.dispose();for(const resource of resources)resource.dispose();}};
}

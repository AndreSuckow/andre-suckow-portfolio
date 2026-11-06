// Movement uses the game's clock, so pause freezes the two-second journey.
export function createCareerJourney(stations,{duration=2,roadX=-1.02}={}){
 let current=0,trip=null,position=[...stations[0]],heading=0;
 function update(time){
  if(!trip)return null;
  const progress=Math.max(0,Math.min(1,(time-trip.start)/duration)),distance=trip.length*progress;
  let covered=0;
  for(const segment of trip.segments){
   if(distance<=covered+segment.length||segment===trip.segments.at(-1)){
    const fraction=Math.min(1,(distance-covered)/segment.length);position=[segment.a[0]+(segment.b[0]-segment.a[0])*fraction,segment.a[1]+(segment.b[1]-segment.a[1])*fraction];heading=Math.atan2(segment.b[0]-segment.a[0],segment.b[1]-segment.a[1]);break;
   }covered+=segment.length;
  }
  if(progress===1){current=trip.target;position=[...stations[current]];trip=null;return current;}
  return null;
 }
 return {
  get current(){return current;},get moving(){return !!trip;},get target(){return trip?.target??current;},get position(){return [...position];},get heading(){return heading;},update,
  walkTo(index,time){
   if(!Number.isInteger(index)||!stations[index]||trip?.target===index||(!trip&&current===index))return false;
   update(time);const destination=stations[index],waypoints=[position,[roadX,position[1]],[roadX,destination[1]],destination],segments=[];
   for(let i=1;i<waypoints.length;i++){const a=[...waypoints[i-1]],b=[...waypoints[i]],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length>.00001)segments.push({a,b,length});}
   trip={start:time,target:index,segments,length:segments.reduce((sum,segment)=>sum+segment.length,0)};return true;
  }
 };
}

export function drawCareerScreen(e,t,n,{companies,colors: X,Q,kv,Ev,wv,Tv,Nv}){
 t.dominant=4;
 Q(e,`NÍVEL ${companies.length}`,48,104,{size:24,bold:true,color:X.violet});
 kv(e,{x:188,y:109,w:360,h:16},8.6,10,X.violet,X.deep);
 Q(e,`XP DESDE ${Math.min(...companies.filter(c=>!c.invitation).map(c=>c.start))}`,564,105,{size:20,color:X.muted});
 t.careerMap??=t.createCareerMap();
 const arrived=t.careerMap.update(n);
 if(arrived!==null){const location=companies[arrived];t.onSelect({id:'experiencia/'+arrived,kind:'career-arrival',label:'Chegou a '+location.org+'. '+location.role});}
 const selected=t.careerMap.current,company=companies[selected],panel={x:48,y:156,w:506,h:548};
 Ev(e,panel,X.slate,X.panel);
 Q(e,`${company.phase} · ${company.title}`.toUpperCase(),72,178,{size:20,color:X.sel,max:458});
 let y=wv(e,company.role,72,212,458,{size:28,bold:true,maxLines:2,lineH:34});
 Q(e,company.org,72,y+8,{size:24,color:X.sky,max:company.logo?340:458});
 const logo=t.assets.screenshots['company/'+company.id];
 if(logo){const scale=Math.min(106/logo.width,50/logo.height);e.save();e.imageSmoothingEnabled=true;e.drawImage(logo,530-logo.width*scale,y+8,logo.width*scale,logo.height*scale);e.restore();}
 Q(e,company.period.toUpperCase(),72,y+40,{size:18,color:X.muted});
 if(company.workMode)Q(e,`${company.location} · ${company.workMode}`,72,y+65,{size:16,color:X.muted,max:458});
 y+=company.workMode?100:80;Tv(e,{x:72,y,w:458,h:2},X.deep);y+=14;
 for(const text of company.tvBullets||company.bullets){if(y>panel.y+panel.h-36)break;Nv(e,'right',72,y+5,10,X.sel);y=wv(e,text,90,y,440,{size:18,color:X.text,maxLines:3,lineH:22})+8;}
 Q(e,'MAPA DA JORNADA',773,168,{size:20,bold:true,color:X.sel,align:'center'});
 const hover=t.hoverId?.startsWith('experiencia/')?Number(t.hoverId.split('/')[1]):null;
 const focused=hover??Math.max(0,Math.min(t.selected,companies.length-1));
 const bounds=t.careerMap.draw(e,{x:568,y:184,w:408,h:514},focused,n,t.reducedMotion);
 companies.forEach((company,index)=>{
  const rect=bounds[index];t.addItem({id:'experiencia/'+index,rect,kind:'career',label:company.org,tooltip:t.careerMap.moving||index===selected?null:'Clique para caminhar até '+company.org});
  const label=company.invitation?'SUA COMPANHIA':index===0?'MARQ HR':'PILGRIM’S';
  Q(e,label,rect.x+rect.w/2,rect.y-7,{size:14,bold:true,color:index===selected?X.sel:X.text,align:'center',max:145});
 });
 Q(e,'■ ANTERIORES',580,704,{size:13,color:'#42d68a'});
 Q(e,'■ PRÓXIMA COMPANHIA',760,704,{size:13,color:'#57a8ff'});
}

// A real orthographic 3D diorama, composited into the TV's existing canvas.
export function createCareerMap(T,companies,assets){
 const {Scene,Group,Mesh,BoxGeometry,PlaneGeometry,BufferGeometry,BufferAttribute,BasicMaterial,CanvasTexture,OrthographicCamera,Renderer,Vector3,SRGB}=T;
 const renderer=new Renderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
 renderer.setSize(408,514);renderer.setPixelRatio(1);renderer.outputColorSpace=SRGB;renderer.setClearColor(0x000000,0);
 const halfHeight=2.95,halfWidth=halfHeight*408/514;
 const scene=new Scene(),camera=new OrthographicCamera(-halfWidth,halfWidth,halfHeight,-halfHeight,.1,40);
 camera.position.set(1.4,10,12);camera.lookAt(0,.24,0);
 const resources=[],materials=new Map(),logos=new Map();
 function mat(color){if(!materials.has(color))materials.set(color,new BasicMaterial({color}));return materials.get(color);}
 function box(parent,x,y,z,w,h,d,color){
  const geometry=new BoxGeometry(w,h,d);resources.push(geometry);
  const faces=Array.isArray(color)?color.map(mat):mat(color),mesh=new Mesh(geometry,faces);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
 }
 const earth=['#314a53','#233742','#5f8670','#253d44','#3a5960','#2b414e'];
 box(scene,0,-.23,0,2.65,.44,7.5,earth);
 box(scene,0,.005,0,2.7,.06,7.6,['#4a7165','#355748','#638a70','#355748','#4a7165','#355748']);
 const points=[[-.1,-2.6],[.55,0],[-.1,2.6]],stations=points.map(([x,z])=>[x-.3,z+.67]),roadX=-1.02,buildings=[],flags=[];
 const journey=createCareerJourney(stations,{duration:2,roadX});
 function path(a,b){const distance=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let step=0;step<=distance;step+=.16){const f=distance?step/distance:0;box(scene,a[0]+(b[0]-a[0])*f,.055,a[1]+(b[1]-a[1])*f,.12,.045,.12,'#b6b5a5');}}
 path([roadX,stations[0][1]],[roadX,stations.at(-1)[1]]);for(const station of stations)path([roadX,station[1]],station);
 // Quiet landscaping makes the terrain's depth readable without obscuring stops.
 for(const [x,z] of [[1.05,2.1],[-.9,-3.25],[1.05,-1.4]]){
  box(scene,x,.15,z,.045,.3,.045,'#a18e69');box(scene,x,.38,z,.26,.32,.26,['#387563','#275d50','#65a381','#234b43','#46846b','#387563']);
 }
 companies.forEach((company,index)=>{
  const [x,z]=points[index],building=new Group();building.position.set(x,.065,z);scene.add(building);
  box(building,0,.035,0,1,.07,.86,'#a6aa9e');
  box(building,0,.38,0,.84,.68,.64,['#9cacc0','#74869b','#e0e4e2','#74869b','#cbd4d8','#8595a9']);
  box(building,0,.77,0,.96,.13,.76,['#3c4b69','#283a55','#657b98','#283a55','#4b6283','#344862']);
  box(building,.22,.24,.326,.16,.4,.02,'#31435c');
  box(building,-.22,.25,.333,.22,.18,.018,'#73b4c6');
  box(building,-.22,.25,.346,.018,.19,.012,'#cbd4d8');
  box(building,-.22,.25,.346,.23,.014,.012,'#cbd4d8');
  const poleX=x+.61,poleZ=z-.14;
  box(scene,poleX,.035,poleZ,.18,.07,.18,'#c4c5b6');
  box(scene,poleX,.66,poleZ,.035,1.28,.035,'#d0d7de');
  const positions=[],uv=[],indices=[],columns=12;
  for(let row=0;row<2;row++)for(let col=0;col<=columns;col++){positions.push(col/columns*.46,1.25-row*.25,0);uv.push(col/columns,1-row);}
  for(let col=0;col<columns;col++){const a=col,b=col+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));geometry.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));geometry.setIndex(indices);geometry.computeVertexNormals();resources.push(geometry);
  const flag=new Mesh(geometry,new BasicMaterial({color:company.invitation?'#57a8ff':'#42d68a',side:2}));flag.position.set(poleX,0,poleZ);scene.add(flag);flags.push(flag);
  buildings.push(building);
 });
 const avatar=new Group();scene.add(avatar);avatar.rotation.y=Math.atan2(1.4,12);
 const leftLeg=box(avatar,-.075,.09,0,.09,.18,.12,'#283b68'),rightLeg=box(avatar,.075,.09,0,.09,.18,.12,'#283b68');
 box(avatar,0,.29,0,.25,.25,.16,['#a96327','#a96327','#ffc56d','#a96327','#ed9c37','#a96327']);
 const leftArm=box(avatar,-.17,.29,0,.075,.22,.09,'#e5a16b'),rightArm=box(avatar,.17,.29,0,.075,.22,.09,'#e5a16b');
 box(avatar,0,.58,0,.37,.37,.2,'#8c6348');
 const marker=box(scene,0,.075,0,1.08,.025,.94,'#ffb547');
 const focusMarker=box(scene,0,.064,0,1.12,.014,.98,'#7f9cdd');
 function picture(image,parent,x,y,z,w,h,key){
  if(!image||logos.has(key))return;
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const c=canvas.getContext('2d');c.fillStyle=key==='portrait'?'#151c30':'#18253d';c.fillRect(0,0,512,256);
  const scale=Math.min(480/image.width,220/image.height);c.imageSmoothingEnabled=key!=='portrait';c.drawImage(image,(512-image.width*scale)/2,(256-image.height*scale)/2,image.width*scale,image.height*scale);
  const texture=new CanvasTexture(canvas);texture.colorSpace=SRGB;resources.push(texture);
  const geometry=new PlaneGeometry(w,h);resources.push(geometry);const material=new BasicMaterial({map:texture});
  const mesh=new Mesh(geometry,material);mesh.position.set(x,y,z);parent.add(mesh);logos.set(key,mesh);
 }
 // The next company is an invitation, so its facade has a labeled placeholder.
 const nextCanvas=document.createElement('canvas');nextCanvas.width=400;nextCanvas.height=160;const next=nextCanvas.getContext('2d');
 next.fillStyle='#18253d';next.fillRect(0,0,400,160);next.fillStyle='#7abfff';next.font='bold 40px Arial';next.textAlign='center';next.fillText('SUA COMPANHIA',200,94);
 function syncArt(){
  companies.forEach((company,i)=>picture(company.invitation?nextCanvas:assets.screenshots['company/'+company.id],buildings[i],0,.58,.332,.72,.24,'company/'+company.id));
  if(assets.portrait&&!logos.has('portrait')){
   const texture=new CanvasTexture(assets.portrait);texture.colorSpace=SRGB;resources.push(texture);
   const geometry=new PlaneGeometry(.375,.375);resources.push(geometry);const mesh=new Mesh(geometry,new BasicMaterial({map:texture,transparent:true}));mesh.position.set(0,.58,.103);avatar.add(mesh);logos.set('portrait',mesh);
  }
 }
 let previousFocused=-1,focusStarted=0;
 return {
  get current(){return journey.current;},get moving(){return journey.moving;},walkTo(index,time){return journey.walkTo(index,time);},update(time){return journey.update(time);},
  draw(ctx,rect,focused,time,reduced){
   syncArt();focused=Math.max(0,Math.min(companies.length-1,focused));if(focused!==previousFocused){previousFocused=focused;focusStarted=time;}buildings.forEach((building,index)=>{const active=index===focused,elapsed=time-focusStarted;building.position.y=.065+(active?.035:0);building.rotation.z=active&&!reduced&&elapsed<.42?Math.sin(elapsed*42)*.035*(1-elapsed/.42):0;});
   const [x,z]=journey.position,walking=journey.moving,step=walking&&!reduced?Math.sin(time*15)*.55:0;
   avatar.position.set(x,walking&&!reduced?Math.abs(Math.sin(time*15))*.018:0,z);avatar.rotation.y=walking?journey.heading:Math.atan2(1.4,12);
   leftLeg.rotation.x=step;rightLeg.rotation.x=-step;leftArm.rotation.x=-step*.7;rightArm.rotation.x=step*.7;
   const [selectedX,selectedZ]=points[journey.current];marker.position.set(selectedX,.075,selectedZ);
   focusMarker.visible=focused!==journey.current;focusMarker.position.set(points[focused][0],.064,points[focused][1]);
   flags.forEach((flag,index)=>{const attr=flag.geometry.attributes.position;for(let row=0;row<2;row++)for(let col=0;col<=12;col++){const f=col/12;attr.setZ(row*13+col,reduced?0:Math.sin(time*5-f*7+index)*.075*f);}attr.needsUpdate=true;});
   renderer.render(scene,camera);ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(renderer.domElement,rect.x,rect.y,rect.w,rect.h);ctx.restore();
   return points.map(([x,z])=>{const p=new Vector3(x,.38,z).project(camera);return {x:rect.x+(p.x+1)/2*rect.w-48,y:rect.y+(1-p.y)/2*rect.h-52,w:104,h:115};});
  },
  dispose(){for(const resource of resources)resource.dispose();for(const material of materials.values())material.dispose();scene.traverse(object=>{if(object.isMesh)for(const material of Array.isArray(object.material)?object.material:[object.material])material.dispose();});renderer.dispose();}
 };
}

// Original low-poly handheld. Local axes: front +z, top +y.
export function createGameBoyModel(T){
 const {Group,Mesh,BoxGeometry,PlaneGeometry,Material,BasicMaterial,CanvasTexture,SRGB}=T;
 const root=new Group();root.name='Game Boy on desk';const resources=[];
 const material=color=>{const m=new Material({color,roughness:.7,metalness:.03});resources.push(m);return m;};
 const shell=material('#c6c4bb'),edge=material('#989a94'),bezel=material('#666777'),black=material('#25262a'),berry=material('#8c244d');
 function box(name,x,y,z,w,h,d,m){const geo=new BoxGeometry(w,h,d);resources.push(geo);const mesh=new Mesh(geo,m);mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;}
 box('Handheld back',0,0,-.004,.125,.205,.021,edge);box('Handheld shell',0,0,.003,.128,.21,.022,shell);
 box('Screen bezel',0,.039,.016,.112,.098,.004,bezel);
 const image=document.createElement('canvas');image.width=320;image.height=288;const c=image.getContext('2d');
 c.fillStyle='#91a75b';c.fillRect(0,0,320,288);c.fillStyle='#253d2b';c.textAlign='center';c.font='bold 28px monospace';c.fillText('GAME BOY',160,125);c.font='16px monospace';c.fillText('CLIQUE PARA JOGAR',160,163);
 const map=new CanvasTexture(image);map.colorSpace=SRGB;resources.push(map);const screenMaterial=new BasicMaterial({map,toneMapped:false});resources.push(screenMaterial);
 const geometry=new PlaneGeometry(.081,.073);resources.push(geometry);const screen=new Mesh(geometry,screenMaterial);screen.position.set(.006,.039,.019);root.add(screen);
 box('D-pad horizontal',-.037,-.034,.018,.043,.014,.009,black);box('D-pad vertical',-.037,-.034,.018,.014,.043,.009,black);
 for(const [name,x,y]of [['B',.026,-.043],['A',.049,-.029]]){const button=box('Button '+name,x,y,.019,.018,.018,.009,berry);button.rotation.z=.1;}
 for(const x of [-.012,.012]){const button=box('Start select',x,-.078,.018,.02,.006,.005,bezel);button.rotation.z=.25;}
 for(let i=0;i<5;i++)box('Speaker slit',.026+i*.008,-.079+i*.002,.016,.003,.026,.003,edge);
 box('Red cartridge',0,.109,-.003,.062,.034,.012,berry);box('Cartridge label',0,.11,.004,.044,.018,.002,shell);
 root.scale.setScalar(.85);root.rotation.set(-Math.PI/2,0,-.22);root.position.set(.48,.523,-.82);
 return {root,dispose(){for(const resource of resources)resource.dispose();}};
}

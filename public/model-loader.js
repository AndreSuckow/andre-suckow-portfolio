// Optimized assets are primary. Original author files remain a per-object fallback.
export const roomModels=[
 {key:'familyFrameScene',id:'portrait',optimized:'./models/optimized/portrait.glb?v=cs-mode-3',original:'./models/portrait/family-frame.gltf?v=cs-mode-3'},
 {key:'bibleScene',id:'bible',optimized:'./models/optimized/bible.glb?v=cs-mode-3',original:'./models/holy_bible/scene.gltf?v=cs-mode-3'},
 {key:'pokedexScene',id:'pokedex',optimized:'./models/optimized/pokedex.glb?v=cs-mode-3',original:'./models/pokedex/scene.gltf?v=cs-mode-3'},
 {key:'discmanScene',id:'discman',optimized:'./models/optimized/discman.glb?v=cs-mode-3',original:'./models/discman_d150/scene.gltf?v=cs-mode-3'},
 {key:'boardScene',id:'board',optimized:'./models/tabuleiro/board.glb?v=cs-mode-3',original:'./models/tabuleiro/ludo/scene.gltf?v=cs-mode-3'},
];
export async function loadRoomModels({Loader,decoder,baseURL=import.meta.url,warn=console.warn}){
 await decoder.ready;
 return Object.fromEntries(await Promise.all(roomModels.map(async model=>{
  const loader=new Loader().setMeshoptDecoder(decoder);
  for(const [variant,file] of [['optimized',model.optimized],['original',model.original]]){
   try{const {scene}=await loader.loadAsync(new URL(file,baseURL).href);scene.userData.assetVariant=variant;return [model.key,scene];}
   catch(error){warn('Falha ao carregar modelo '+model.id+' ('+variant+')',error);}
  }
  return [model.key,null];
 })));
}

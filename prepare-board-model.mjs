import fs from 'node:fs/promises';
import {NodeIO} from '@gltf-transform/core';
import {prune,dedup} from '@gltf-transform/functions';
import sharp from 'sharp';

// Keep the supplied Ludo board, removing loose pawns/dice from the leaning prop.
const io=new NodeIO(),doc=await io.read('public/models/tabuleiro/ludo/scene.gltf'),root=doc.getRoot();
const board=root.listNodes().find(node=>node.getName()==='Board Baked');
if(!board)throw Error('Supplied board node not found');
const keep=new Set();for(let node=board;node;node=node.getParentNode())keep.add(node);
const children=node=>{keep.add(node);for(const child of node.listChildren())children(child);};children(board);
for(const node of [...root.listNodes()])if(!keep.has(node))node.dispose();
for(const mat of root.listMaterials()){mat.setMetallicRoughnessTexture(null);mat.setNormalTexture(null);mat.setOcclusionTexture(null);mat.setRoughnessFactor(.8);}
await doc.transform(prune(),dedup());
for(const texture of root.listTextures()){const bytes=await sharp(texture.getImage()).resize({width:512,height:512,fit:'inside',withoutEnlargement:true}).jpeg({quality:90}).toBuffer();texture.setImage(bytes).setMimeType('image/jpeg');}
await io.write('public/models/tabuleiro/board.glb',doc);
console.log('Prepared supplied board:',(await fs.stat('public/models/tabuleiro/board.glb')).size,'bytes');

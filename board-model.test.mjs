import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {NodeIO} from '@gltf-transform/core';
import {getBounds} from '@gltf-transform/functions';

test('the supplied board preserves its wooden geometry and artwork without loose pawns or dice',async()=>{
 const path='public/models/tabuleiro/board.glb',doc=await new NodeIO().read(path),root=doc.getRoot();
 assert(root.listNodes().some(node=>node.getName()==='Board Baked'));
 assert(!root.listNodes().some(node=>/^Pawn|^Dice/.test(node.getName())));
 assert.equal(root.listMeshes().length,2);assert(root.listTextures().length>0);
 const {min,max}=getBounds(root.getDefaultScene());assert(max[1]-min[1]<(max[0]-min[0])/10,'Board must be flat before placement');
 assert(fs.statSync(path).size<300000,'The room should not load the full source scene');
});

// Shared by the room geometry, cartridge rest positions and project camera.
export const PROJECT_SHELF={columns:3,firstX:.47,spacing:.21,deskSpacing:.13,baseY:.514,rowHeight:.335,z:-1.04,restOffset:.014,width:.66,depth:.24,thickness:.03};
export function projectCartridgeLayout(count){
 if(!Number.isInteger(count)||count<1)throw Error('Project shelf requires at least one cartridge');
 return Array.from({length:count},(_,index)=>({position:[PROJECT_SHELF.firstX+(index%PROJECT_SHELF.columns)*(index<PROJECT_SHELF.columns?PROJECT_SHELF.deskSpacing:PROJECT_SHELF.spacing),PROJECT_SHELF.baseY+Math.floor(index/PROJECT_SHELF.columns)*PROJECT_SHELF.rowHeight,PROJECT_SHELF.z],rotationX:.1222}));
}
export function projectShelves(count){
 const rows=Math.ceil(count/PROJECT_SHELF.columns);
 return Array.from({length:Math.max(0,rows-1)},(_,index)=>({x:PROJECT_SHELF.firstX+PROJECT_SHELF.spacing,y:PROJECT_SHELF.baseY+(index+1)*PROJECT_SHELF.rowHeight-PROJECT_SHELF.restOffset-PROJECT_SHELF.thickness/2,z:PROJECT_SHELF.z,width:PROJECT_SHELF.width,depth:PROJECT_SHELF.depth,thickness:PROJECT_SHELF.thickness}));
}

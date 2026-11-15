import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setLpcSurfaces,drawLpcFloor,drawLpcRug,drawLpcWall} from '../src/lpc-surfaces.js';
import {rooms} from '../hunt-world.mjs';
test('licensed floor and rug crops fit their atlas and preserve room geometry',()=>{
 const atlas={width:1024,height:2048},before=structuredClone(rooms);let crops=0;
 const g={save(){},restore(){},fillRect(){},drawImage(im,sx,sy,sw,sh,x,y,w,h){assert(im===atlas||im.width===2048);assert(sx>=0&&sy>=0&&sx+sw<=im.width&&sy+sh<=im.height);assert([x,y,w,h].every(Number.isFinite));assert(w>0&&h>0);crops++;}};
 try{setLpcSurfaces({floors:atlas,walls:{width:2048,height:3072}});for(const r of rooms){drawLpcFloor(g,r.kind,32,32);drawLpcWall(g,r.kind,0,0);assert(drawLpcRug(g,16,16,80,48,r.kind));}assert(crops>180);assert.deepEqual(rooms,before);}finally{setLpcSurfaces(null);}
});
test('compact runtime atlas covers every room finish and clipped raised wall',()=>{
 const atlas={width:256,height:384};let crops=0,clips=0;
 const g={save(){},restore(){},beginPath(){},rect(){},clip(){clips++;},fillRect(){},drawImage(im,x,y,w,h){assert.equal(im,atlas);assert(x>=0&&y>=0&&x+w<=256&&y+h<=384);crops++;}};
 try{setLpcSurfaces({materials:atlas});for(const room of rooms){drawLpcFloor(g,room.kind,0,0);drawLpcRug(g,0,0,80,48,room.kind);drawLpcWall(g,room.kind,0,0,[{x:0,y:0,w:16,h:14}]);}assert(crops>180);assert.equal(clips,rooms.length);}finally{setLpcSurfaces(null);}
});

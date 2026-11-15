import {test} from 'node:test';import assert from 'node:assert/strict';
import {create,addPlayer,act,tick,view} from '../hunt.mjs';import {doors,nearDoor,fits} from '../hunt-world.mjs';
function setup(){const r=create('Host',1000,13);for(let i=0;i<7;i++)addPlayer(r,'Guest '+i,false,1000);act(r,r.players[0],{action:'setKiller',target:r.players[1].id},1000);act(r,r.players[0],{action:'start'},1000);for(const p of r.players)r.positions[p.id]={floor:2,x:520,y:100,dir:'right'};return r;}
test('one close request in an occupied doorway closes safely after everyone clears it',()=>{
 const r=setup(),p=r.players[0],q=r.players[2],d=doors[0];r.positions[p.id]={floor:d.floor,x:d.x,y:d.y,dir:'right'};r.positions[q.id]={...r.positions[p.id]};
 act(r,p,{action:'door',object:d.id},20000);assert(view(r,p,20000).pendingDoors.includes(d.id));assert(!r.manualDoors[d.id]);
 r.positions[p.id]={floor:2,x:520,y:100,dir:'right'};tick(r,20100);assert(!r.manualDoors[d.id]);r.positions[q.id]={...r.positions[p.id]};tick(r,20200);assert(r.manualDoors[d.id]);assert(!r.pendingDoors[d.id]);
});
test('pending closure can be cancelled and never snaps shut on a player after expiry',()=>{
 const r=setup(),p=r.players[0],d=doors[0];r.positions[p.id]={floor:d.floor,x:d.x,y:d.y,dir:'right'};
 act(r,p,{action:'door',object:d.id},20000);act(r,p,{action:'door',object:d.id},20100);assert(!r.pendingDoors[d.id]);assert(!r.manualDoors[d.id]);
 act(r,p,{action:'door',object:d.id},20200);tick(r,24300);assert(!r.pendingDoors[d.id]);assert(!r.manualDoors[d.id]);
});
test('larger door interaction reach still rejects other floors and does not require exact threshold placement',()=>{
 const r=setup(),p=r.players[0],d=doors[0];const horizontal=d.w>d.h;
 const a={floor:d.floor,x:d.x+(horizontal?0:d.w/2+32),y:d.y+(horizontal?d.h/2+32:0),dir:'right'};
 assert(fits(a.floor,a.x,a.y));assert(nearDoor(a,d));assert(!nearDoor({...a,floor:2},d));r.positions[p.id]=a;act(r,p,{action:'door',object:d.id},20000);assert(r.manualDoors[d.id]);
});

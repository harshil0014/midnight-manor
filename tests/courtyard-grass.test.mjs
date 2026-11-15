import {test} from 'node:test';import assert from 'node:assert/strict';
import {create,addPlayer,act,view,movePlayer,killer} from '../hunt.mjs';
import {arches,grass,passageNodes,passageDestinations,machines,fits} from '../hunt-world.mjs';
import {routeTo} from '../src/hunt-navigation.js';
function setup(){const r=create('Host',1000,13);for(let i=0;i<7;i++)addPlayer(r,'Guest '+i,false,1000);act(r,r.players[0],{action:'setKiller',target:r.players[1].id},1000);act(r,r.players[0],{action:'start'},1000);return r;}
test('exactly two ground-floor courtyard door pairs, no upstairs entrance, and walking works in all directions',()=>{
 assert.equal(arches.length,4);assert.equal(arches.filter(a=>a.floor===0).length,2);assert.equal(arches.filter(a=>a.floor===1).length,0);assert.equal(arches.filter(a=>a.floor===2).length,2);
 for(const a of arches){const r=setup(),p=r.players[0],[dx,dy]=[[-12,0],[12,0],[0,12],[0,-12]].find(([dx,dy])=>fits(a.floor,a.x+dx,a.y+dy));r.positions[p.id]={floor:a.floor,x:a.x+dx,y:a.y+dy,dir:'right'};movePlayer(r,p,-dx,-dy,.05,20000);assert.equal(r.positions[p.id].floor,a.to.floor);assert(fits(a.to.floor,r.positions[p.id].x,r.positions[p.id].y));}
 const upper={floor:1,x:552,y:392,dir:'down'},outside=machines.find(m=>m.floor===2);assert(routeTo(upper,outside).length>0);
});
test('survivors see translucent teammates in grass, hunter never receives them even at touching range or through SCREAM/GPS',()=>{
 const r=setup(),p=r.players[0],q=r.players[2],k=killer(r),g=grass[0],a={floor:2,x:(g.x+2)*16+8,y:(g.y+2)*16+8,dir:'right'};
 r.positions[p.id]={...a};r.positions[q.id]={...a,x:a.x+20};r.positions[k.id]={...a,x:a.x+8};
 assert(view(r,p,20000).avatars.find(v=>v.id===p.id).grass);assert(view(r,q,20000).avatars.find(v=>v.id===p.id).grass);
 assert(!view(r,k,20000).avatars.some(v=>v.id===p.id));act(r,k,{action:'power'},20000);assert(!view(r,k,20001).reveals.some(v=>v.id===p.id));
 p.hulkUntil=32000;assert(!view(r,k,20001).hulkGPS.some(v=>v.id===p.id));
 r.dark=true;assert(view(r,q,20001).avatars.some(v=>v.id===p.id));assert(!view(r,k,20001).avatars.some(v=>v.id===p.id));
});
test('courtyard boundary cannot be bypassed by passage networks or a cross-boundary Magician pair',()=>{
 for(const source of passageNodes)for(const id of passageDestinations({role:'Survivor',class:'Escape Artist'},source)){const target=passageNodes.find(o=>o.id===id);assert.equal(source.floor===2,target.floor===2);}
 const r=setup(),p=r.players[0];p.class='Magician';r.chests=[];r.positions[p.id]={floor:0,x:552,y:392,dir:'right'};act(r,p,{action:'power'},20000);r.positions[p.id]={floor:2,x:520,y:376,dir:'down'};assert.throws(()=>act(r,p,{action:'power'},20100),/courtyard door/);assert.equal(r.portals.length,1);
});

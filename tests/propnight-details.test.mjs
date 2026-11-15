import {test} from 'node:test';import assert from 'node:assert/strict';
import {create,addPlayer,act,tick,view,killer} from '../hunt.mjs';
import {passageNodes,passageDestinations,interactionPoint,machines} from '../hunt-world.mjs';
import {rescueNeeds} from '../src/propnight-details.js';
function setup(){const r=create('Host',1000,13);for(let i=0;i<7;i++)addPlayer(r,'Guest '+i,false,1000);act(r,r.players[0],{action:'setKiller',target:r.players[1].id},1000);act(r,r.players[0],{action:'start'},1000);return r;}
test('hit/miss confirmations are per-seat, short-lived and carry no target identity or coordinates',()=>{
 const r=setup(),k=killer(r),p=r.players[0],remote=r.players[2];for(const q of r.players)r.positions[q.id]={floor:2,x:520,y:100,dir:'down'};r.positions[k.id]={floor:0,x:552,y:392,dir:'right'};r.positions[p.id]={floor:0,x:568,y:392,dir:'left'};r.positions[remote.id]={floor:2,x:520,y:100,dir:'down'};
 act(r,k,{action:'attack',direction:'right'},20000);tick(r,20350);const hit=view(r,k,20350).me.feedback;assert.equal(hit.kind,'hit');assert.deepEqual(Object.keys(hit).sort(),['at','kind','seq']);assert.equal(view(r,remote,20350).me.feedback,null);assert.equal(view(r,k,21600).me.feedback,null);
 act(r,k,{action:'attack',direction:'left'},22000);tick(r,22350);assert.equal(view(r,k,22350).me.feedback.kind,'miss');assert(!('grass'in view(r,k,22350).players[0]));
});
test('flash confirmation distinguishes a landed stun from resistance without changing stun duration',()=>{
 const r=setup(),p=r.players[0],q=r.players[2],k=killer(r);for(const player of[p,q]){player.class='Photographer';r.positions[player.id]={floor:0,x:552,y:392,dir:'right'};}r.positions[k.id]={floor:0,x:580,y:392,dir:'left'};
 act(r,p,{action:'power',direction:'right'},20000);assert.equal(view(r,p,20000).me.feedback.kind,'stun');assert.equal(view(r,k,20000).me.resistUntil,28000);assert.equal(k.stunUntil,21500);
 act(r,q,{action:'power',direction:'right'},22000);assert.equal(view(r,q,22000).me.feedback.kind,'resisted');assert.equal(k.stunUntil,21500);
});
test('passage entry and exit emit local audio and traversal metadata only for visible avatars',()=>{
 const r=setup(),p=r.players[0];p.class='Escape Artist';const source=passageNodes.find(s=>s.floor===0&&passageDestinations(p,s).some(id=>passageNodes.find(d=>d.id===id).floor===1)),id=passageDestinations(p,source).find(id=>passageNodes.find(d=>d.id===id).floor===1);
 r.positions[p.id]={...interactionPoint(source),dir:'right'};act(r,p,{action:'travel',object:source.id,destination:id},20000);assert.equal(r.sounds.at(-1).kind,'hatch');assert(view(r,p,20100).avatars.find(a=>a.id===p.id).travelling);tick(r,21400);assert.equal(r.sounds.at(-1).kind,'hatch');assert.equal(r.sounds.at(-1).floor,1);
});
test('rescue cards prioritize urgent existing team information and never appear for the hunter or a captive',()=>{
 const s={phase:'hunt',me:{id:'self',role:'Survivor',status:'active'},players:[{id:'a',captures:2}],rescues:[{id:'b',status:'downed',until:60000},{id:'a',status:'captured',until:30000},{id:'c',status:'carried',until:10000}]};
 assert.deepEqual(rescueNeeds(s,20000).map(r=>[r.id,r.seconds,r.captures]),[['a',10,2],['b',40,0]]);assert.deepEqual(rescueNeeds({...s,me:{...s.me,role:'Killer'}},20000),[]);assert.deepEqual(rescueNeeds({...s,me:{...s.me,status:'captured'}},20000),[]);
});

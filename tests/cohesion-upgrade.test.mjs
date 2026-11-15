import {test} from 'node:test';
import assert from 'node:assert/strict';
import {create,addPlayer,act,view,movePlayer,killer} from '../hunt.mjs';
import {tables,doors} from '../hunt-world.mjs';
import {SpatialAudio} from '../src/spatial-audio.js';
import {strikeOutline,channelFraction} from '../src/chase-presentation.js';
function setup(){const r=create('Host',1000,13);for(let i=0;i<7;i++)addPlayer(r,'Guest '+i,false,1000);act(r,r.players[0],{action:'setKiller',target:r.players[1].id},1000);act(r,r.players[0],{action:'start'},1000);return r;}
test('rescue progress is visible on an authorized victim and to the victim, never exposes rescuer identity or distant avatars',()=>{
 const r=setup(),p=r.players[0],v=r.players[2],remote=r.players[3],t=tables[0];
 v.status='captured';v.table=t.id;v.captureUntil=80000;r.positions[v.id]={floor:t.floor,x:t.x,y:t.y,dir:'down'};r.positions[p.id]={floor:t.floor,x:t.x+20,y:t.y,dir:'left'};r.positions[remote.id]={floor:2,x:520,y:100,dir:'down'};
 act(r,p,{action:'rescue',target:v.id},20000);
 assert.deepEqual(view(r,v,20100).me.assist,{started:20000,until:22200});
 assert.deepEqual(view(r,p,20100).avatars.find(a=>a.id===v.id).assist,{started:20000,until:22200});
 assert(!view(r,remote,20100).avatars.some(a=>a.id===v.id));assert.equal(view(r,remote,20100).me.assist,null);
 movePlayer(r,p,1,0,.05,20200);assert.equal(view(r,v,20200).me.assist,null);
});
test('attack wind-up metadata belongs to visible avatars and a closed door clips its outline',()=>{
 const r=setup(),k=killer(r);act(r,k,{action:'attack',direction:'down'},20000);
 const windup=view(r,k,20001).avatars.find(a=>a.id===k.id).strike;assert.equal(windup.started,20000);assert.equal(windup.range,36);assert.equal(channelFraction(windup,20175),.5);
 const d=doors[0],horizontal=d.w>d.h,p={floor:d.floor,x:d.x+(horizontal?0:-20),y:d.y+(horizontal?-20:0),strike:{direction:horizontal?'down':'right',range:36}};
 const outline=strikeOutline(p,{closedDoors:[d],broken:[]});assert.equal(outline.length,17);
 assert(Math.hypot(outline[8].x-p.x,outline[8].y-p.y)<20);
 assert(outline.every(q=>Math.hypot(q.x-p.x,q.y-p.y)<=37));
});
test('directional sound sequence resets across same-room rematches and muted cues do not replay',()=>{
 const player=new SpatialAudio(),heard=[];player.play=(_,s)=>heard.push(s.seq);
 const state={code:'ROOM',round:1,phase:'lobby',sounds:[{seq:90}],me:{}};
 player.update(state,null,true);player.update(state,null,true);assert.deepEqual(heard,[90]);
 player.update({...state,round:2,sounds:[{seq:1}]},null,true);assert.deepEqual(heard,[90,1]);
 player.update({...state,round:2,sounds:[{seq:2}]},null,false);player.update({...state,round:2,sounds:[{seq:2}]},null,true);assert.deepEqual(heard,[90,1]);
});
test('aggregate results are released only when a match has ended',()=>{
 const r=setup(),p=r.players[0];assert.equal(view(r,p,20000).results,null);r.stats.rescues=3;r.phase='ended';assert.equal(view(r,p,20000).results.rescues,3);
});

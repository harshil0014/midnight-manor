import {test} from 'node:test';
import assert from 'node:assert/strict';
import {create,addPlayer,act,movePlayer,view,killer,tick} from '../hunt.mjs';
import {drawRadar} from '../src/hunt-radar.js';
const at=20000;
function setup(){const r=create('Host',1000,13);for(let i=1;i<8;i++)addPlayer(r,'Seat '+i,false,1000);
 act(r,r.players[0],{action:'setKiller',target:r.players[1].id},1000);act(r,r.players[0],{action:'start'},1000);
 for(const q of r.players){q.connected=true;r.positions[q.id]={floor:1,x:552,y:56,dir:'down'};}
 const p=r.players[0];p.class='Hulk';r.positions[p.id]={floor:0,x:552,y:392,dir:'right'};return {r,p};}
test('transformed Hulk is exactly 5 percent slower than a normal survivor',()=>{
 const {r,p}=setup();movePlayer(r,p,1,0,.1,at);const regular=r.positions[p.id].x-552;
 r.positions[p.id].x=552;act(r,p,{action:'power'},at-2900);tick(r,at+100);movePlayer(r,p,1,0,.1,at+200);
 assert(Math.abs((r.positions[p.id].x-552)/regular-.95)<1e-10);
});
test('actual Hulk footsteps broadcast globally across floors and darkness; standing still emits none',()=>{
 const {r,p}=setup();act(r,p,{action:'power'},at-3000);tick(r,at);
 assert.equal(view(r,killer(r),at).hulkFootstep,null);
 movePlayer(r,p,1,0,.1,at+100);const first=r.hulkFootstep;
 assert(first?.seq>0);r.dark=true;
 assert.deepEqual(view(r,killer(r),at+110).hulkFootstep,first);
 assert.deepEqual(view(r,r.players[2],at+110).hulkFootstep,first);
 movePlayer(r,p,0,0,.1,at+400);assert.equal(r.hulkFootstep.seq,first.seq);
 assert.equal(view(r,killer(r),at+700).hulkFootstep,null);
 movePlayer(r,p,1,0,.1,at+800);assert(r.hulkFootstep.seq>first.seq);
 assert.equal(view(r,killer(r),at+12100).hulkFootstep,null);
});
test('Scientist injection activates during a blackout for twelve seconds',()=>{
 const {r,p}=setup();r.dark=true;act(r,p,{action:'power'},at-3000);tick(r,at);
 assert.equal(view(r,p,at).me.hulkUntil,at+12000);
 assert.equal(view(r,killer(r),at+11999).hulkGPS.length,1);
 assert.equal(view(r,killer(r),at+12000).hulkGPS.length,0);
 assert.equal(view(r,p,at+100).liveMap.length,1);
});
test('radar keeps painting room layout and self arrow in darkness without other player dots',()=>{
 const calls=[];const g=new Proxy({}, {get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});
 const canvas={width:600,height:400,getContext:()=>g};
 const s={position:{floor:0,x:552,y:392,dir:'right'},me:{id:'self',role:'Survivor'},dark:true,
 liveMap:[{id:'self',floor:0,x:552,y:392},{id:'other',floor:0,x:565,y:392,role:'Survivor'},{id:'hunter',floor:0,x:575,y:392,role:'Killer'}]};
 drawRadar(canvas,s);assert(calls.filter(c=>c[0]==='fillRect').length>5);
 assert(calls.some(c=>c[0]==='rotate'));assert(calls.some(c=>c[0]==='clip'));assert.equal(calls.filter(c=>c[0]==='arc').length,0);
 const localMap=JSON.stringify(calls);calls.length=0;drawRadar(canvas,s,1,true);
 assert.equal(JSON.stringify(calls),localMap,'expanded map cannot reveal another floor or more terrain during blackout');
 calls.length=0;s.dark=false;drawRadar(canvas,s);assert.equal(calls.filter(c=>c[0]==='arc').length,1);
 calls.length=0;s.me.role='Killer';drawRadar(canvas,s);assert.equal(calls.filter(c=>c[0]==='arc').length,0);
});
test('three-second transformation freezes movement and grants twelve full seconds only after completion',()=>{
 const {r,p}=setup();act(r,p,{action:'power'},at);
 assert.equal(p.hulkUntil,0);assert.equal(p.hulkReadyAt,at+3000);
 const before={...r.positions[p.id]};movePlayer(r,p,1,0,.1,at+100);
 assert.deepEqual(r.positions[p.id],before);
 assert.throws(()=>act(r,p,{action:'attack'},at+100));
 act(r,p,{action:'close'},at+200);assert.equal(p.hulkReadyAt,at+3000);
 tick(r,at+2999);assert.equal(p.hulkUntil,0);
 tick(r,at+3000);assert.equal(p.hulkReadyAt,0);assert.equal(p.hulkUntil,at+15000);
 assert.equal(view(r,killer(r),at+14999).hulkGPS.length,1);
 assert.equal(view(r,killer(r),at+15000).hulkGPS.length,0);
});
test('being downed during the wind-up interrupts the one-use injection',()=>{
 const {r,p}=setup(),k=killer(r);r.positions[k.id]={floor:0,x:576,y:392,dir:'left'};
 act(r,p,{action:'power'},at);act(r,k,{action:'attack',direction:'left'},at+1);
 tick(r,at+351);assert.equal(p.status,'downed');assert.equal(p.hulkReadyAt,0);
 tick(r,at+3100);assert.equal(p.hulkUntil,0);p.status='active';
 assert.throws(()=>act(r,p,{action:'power'},at+3200),/already/);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {create,addPlayer,act,view,movePlayer,movementMultiplier,killer,tick} from '../hunt.mjs';
function lobby(){const r=create('Host',1000,13);for(let i=0;i<7;i++)addPlayer(r,'Guest '+i,i===6,1000);return r;}
test('bots still reach and repair machines at both supported speed extremes',()=>{
 for(const speed of [.75,2]){
  const r=lobby();r.players.forEach(p=>{p.bot=true;p.connected=false;});act(r,r.players[0],{action:'setSpeed',speed},1000);act(r,r.players[0],{action:'start'},1000);
  for(let t=1050;t<91000;t+=50)tick(r,t,.05);
  assert(Object.values(r.machines).some(m=>m.progress>.1),`Bots did not repair at ${speed}x`);
 }
});
test('only host in lobby can choose a finite supported movement speed; all seats receive it',()=>{
 const r=lobby(),h=r.players[0],g=r.players[1];
 assert.equal(r.speed,1);assert.throws(()=>act(r,g,{action:'setSpeed',speed:2},2000));
 for(const speed of [NaN,Infinity,0,-1,2.25,'1.5',null])assert.throws(()=>act(r,h,{action:'setSpeed',speed},2000));
 act(r,h,{action:'setSpeed',speed:1.5},2000);assert(r.players.every(p=>view(r,p,2000).speed===1.5));
 act(r,h,{action:'start'},2000);assert.throws(()=>act(r,h,{action:'setSpeed',speed:2},3000));
});
test('speed scales real movement and every relative state while preserving collision and chase ratios',()=>{
 const r=lobby(),p=r.players[0];act(r,p,{action:'start'},2000);
 for(const state of [{},{role:'Killer'},{status:'downed'},{status:'eliminated'},{carrying:'victim'},{hulkUntil:99999},{dashUntil:99999},{boostUntil:99999},{role:'Killer',channel:{kind:'strike'}}]){
  const q={...p,status:'active',role:'Survivor',carrying:null,hulkUntil:0,dashUntil:0,boostUntil:0,channel:null,...state};
  r.speed=1;const base=movementMultiplier(r,q,20000);for(const speed of [.75,1.25,1.5,2]){r.speed=speed;assert(Math.abs(movementMultiplier(r,q,20000)-base*speed)<1e-9);}
 }
 for(const speed of [.75,1,2]){r.speed=speed;r.positions[p.id]={floor:0,x:552,y:392,dir:'right'};p.class='Photographer';p.status='active';p.role='Survivor';movePlayer(r,p,1,0,.05,20000);assert(Math.abs(r.positions[p.id].x-552-4.2*speed)<1e-7);}
});
test('rematch keeps room, host, seats, bots and settings but clears all transient state before lobby',()=>{
 const r=lobby(),h=r.players[0];act(r,h,{action:'setSpeed',speed:1.75},2000);act(r,h,{action:'setKiller',target:r.players[1].id},2000);act(r,h,{action:'start'},2000);
 const ids=r.players.map(p=>({id:p.id,token:p.token,name:p.name,bot:p.bot})),code=r.code,round=r.round,refs=[...r.players];
 Object.assign(h,{hidden:'wardrobe',hulkUsed:true,hulkUntil:99999,keys:2,carrying:'victim',input:{x:1,y:0}});
 r.dark=true;r.manualDoors={door:true};r.sounds=[{seq:1}];r.sensors=[{}];r.phase='ended';
 assert.throws(()=>act(r,r.players[1],{action:'restart'},20000));act(r,h,{action:'restart'},20000);
 assert.equal(r.phase,'lobby');assert.equal(r.code,code);assert.equal(r.speed,1.75);assert.equal(r.round,round);
 assert.deepEqual(r.players.map(p=>({id:p.id,token:p.token,name:p.name,bot:p.bot})),ids);assert(r.players.every((p,i)=>p===refs[i]));
 assert.equal(h.hidden,null);assert.equal(h.hulkUsed,false);assert.equal(h.keys,0);assert.equal(h.carrying,null);assert.deepEqual(h.input,{x:0,y:0});assert.equal(r.dark,false);assert.deepEqual(r.manualDoors,{});assert.deepEqual(r.sensors,[]);assert(!r.sounds?.length);
 act(r,h,{action:'start'},21000);assert.equal(r.round,round+1);assert.equal(killer(r).id,ids[1].id);assert.equal(r.speed,1.75);assert.equal(r.players.length,8);
});

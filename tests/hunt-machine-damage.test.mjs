import {test} from 'node:test';
import assert from 'node:assert/strict';
import {create,addPlayer,act,tick,killer,movePlayer,view} from '../hunt.mjs';
import {machines,huntRules} from '../hunt-world.mjs';
const at=20000;
function setup(progress=.9){
 const r=create('Host',1000,13);for(let i=1;i<8;i++)addPlayer(r,'Seat '+i,false,1000);
 act(r,r.players[0],{action:'setKiller',target:r.players[1].id},1000);
 act(r,r.players[0],{action:'start'},1000);
 for(const q of r.players){q.connected=true;r.positions[q.id]={floor:2,x:520,y:400,dir:'down'};}
 const k=killer(r),m=machines[0],o=r.machines[m.id];o.progress=progress;
 r.positions[k.id]={floor:m.floor,x:m.point.x,y:m.point.y,dir:'up'};
 return {r,k,m,o};
}
test('damage channels two seconds, removes forty points, synchronizes and limits repetition',()=>{
 const {r,k,m,o}=setup();const cmd={action:'damageMachine',object:m.id};
 act(r,k,cmd,at);tick(r,at+1900,.05);assert.equal(o.progress,.9);
 assert.equal(view(r,k,at+1900).me.channel.kind,'damageMachine');
 tick(r,at+2000,.05);assert.equal(o.progress,.5);assert.equal(o.done,false);assert.equal(r.stats.repairs,0);
 assert.equal(view(r,r.players[0],at+2000).machines[0].progress,.5);
 assert.equal(k.damageAt,at+2000+huntRules.machineDamageCooldown);
 assert.throws(()=>act(r,k,cmd,at+2001),/cooling/);
 k.damageAt=0;assert.throws(()=>act(r,k,cmd,at+2001),/protected/);
 act(r,k,cmd,at+62001);tick(r,at+64001,.05);assert(Math.abs(o.progress-.1)<1e-8);
});
test('damage rejects innocent, remote, cross-floor, carried, completed and empty machines',()=>{
 const {r,k,m,o}=setup(),cmd={action:'damageMachine',object:m.id},p=r.players[0];
 assert.throws(()=>act(r,p,cmd,at));
 r.positions[k.id].floor=2;assert.throws(()=>act(r,k,cmd,at));
 r.positions[k.id]={floor:m.floor,x:m.x+100,y:m.y};assert.throws(()=>act(r,k,cmd,at));
 r.positions[k.id]={floor:m.floor,x:m.point.x,y:m.point.y};
 k.carrying=p.id;assert.throws(()=>act(r,k,cmd,at));k.carrying=null;
 o.done=true;assert.throws(()=>act(r,k,cmd,at));o.done=false;
 o.progress=0;assert.throws(()=>act(r,k,cmd,at));
});
test('movement or stun cancels damage without spending cooldown; completed race is safe',()=>{
 const {r,k,m,o}=setup(),cmd={action:'damageMachine',object:m.id};
 act(r,k,cmd,at);movePlayer(r,k,1,0,.05,at+100);tick(r,at+2100,.05);
 assert.equal(o.progress,.9);assert.equal(k.damageAt,0);
 r.positions[k.id]={floor:m.floor,x:m.point.x,y:m.point.y};
 act(r,k,cmd,at+2200);k.stunUntil=at+6000;tick(r,at+4300,.05);assert.equal(o.progress,.9);
 k.stunUntil=0;act(r,k,cmd,at+6500);o.done=true;o.progress=1;tick(r,at+8600,.05);
 assert.equal(o.progress,1);assert.equal(k.damageAt,0);
});
test('damage floors at zero and does not reset the spirit contribution budget',()=>{
 const {r,k,m,o}=setup(.2);o.ghostWork=.18;
 act(r,k,{action:'damageMachine',object:m.id},at);tick(r,at+2100,.05);
 assert.equal(o.progress,0);assert.equal(o.ghostWork,.18);
});

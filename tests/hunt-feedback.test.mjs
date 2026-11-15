import {test} from 'node:test';import assert from 'node:assert/strict';
import {collectFeedback,paintFeedback,feedbackScale,feedbackAngle} from '../src/hunt-feedback.js';
function state(){return {code:'ROOM',phase:'hunt',dark:false,serverNow:1000,position:{floor:0,x:552,y:392},me:{id:'self',status:'active',keys:0,sensors:0,whip:0,battery:0,powerAt:0},avatars:[{id:'self',floor:0,x:552,y:392,status:'active'}],machines:[],chests:[],drawers:[],sensors:[],portals:[],closedDoors:[],events:[]};}
test('feedback is derived from authorized changes, is brief and does not mutate game state',()=>{
 const before=state(),after=structuredClone(before);after.me.keys=1;after.me.channel={kind:'drawer',started:1000};after.chests=[{id:'c',floor:0,x:550,y:392,opened:true}];
 const pristine=structuredClone(after),fx=collectFeedback(before,after);assert(fx.some(e=>e.kind==='loot'));assert(fx.some(e=>e.kind==='action'));assert(fx.every(e=>e.duration<=320));assert.deepEqual(after,pristine);assert.deepEqual(collectFeedback(after,after),[]);
});
test('global notices cannot create location effects for unseen players',()=>{
 const before=state(),after=structuredClone(before);after.events=[{seq:1,type:'rescue',at:1000,x:999,y:999,floor:1}];
 assert(collectFeedback(before,after).every(e=>e.hud));assert.deepEqual(collectFeedback(null,after),[]);
});
test('painted effects expire, remain on their own floor, and reduced motion removes sprite displacement',()=>{
 const calls=[],g=new Proxy({},{get:(o,k)=>(...args)=>{calls.push(k);return g;}}),fx=[{kind:'action',floor:0,x:10,y:10,actor:'self',at:100,duration:260}];
 paintFeedback(g,fx,200,1);assert.deepEqual(calls,['clear']);calls.length=0;
 paintFeedback(g,fx,400,0);assert.deepEqual(calls,['clear']);calls.length=0;
 paintFeedback(g,fx,200,0);assert(calls.includes('strokeCircle'));assert(feedbackScale(fx,'self',200)>1);assert(feedbackAngle(fx,'self',200)>0);assert.equal(feedbackScale(fx,'self',200,true),1);assert.equal(feedbackAngle(fx,'self',200,true),0);
});
test('repairs, damage, powers, sensors and travel each produce event feedback',()=>{
 const before=state(),after=structuredClone(before);before.machines=[{id:'m',progress:.9,done:false}];after.machines=[{id:'m',floor:0,x:10,y:10,progress:.5,done:false}];after.sensors=[{id:'s',floor:0,x:12,y:10}];after.portals=[{id:'p',floor:0,x:13,y:10}];after.me.powerAt=2000;
 const kinds=collectFeedback(before,after).map(e=>e.kind);for(const k of ['impact','power','travel'])assert(kinds.includes(k),k);
});

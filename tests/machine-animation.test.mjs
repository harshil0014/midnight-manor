import {test} from 'node:test';
import assert from 'node:assert/strict';
import {drawHuntProps} from '../src/hunt-props.js';
function frame(scene,m,time,reduced=false){
 const calls=[];const g=new Proxy({}, {get:(_,name)=>(...args)=>{if(name==='fillRect'&&Math.abs(args[0]-m.x)<25&&Math.abs(args[1]-m.y)<40)calls.push(args);return g;}});scene.markers=g;
 drawHuntProps(scene,{code:'TEST',position:{floor:0},machines:[m],tables:[],exits:[],portals:[],sensors:[],broken:[],rustles:[]},time,time,reduced);return calls;
}
test('all four machine styles animate only while working or complete; reduced motion keeps a static presentation',()=>{
 for(let number=1;number<=4;number++){
  const m={id:'machine',number,floor:0,x:248,y:200,progress:.55,workers:0,done:false},original=structuredClone(m),scene={};
  assert.deepEqual(frame(scene,m,1000),frame(scene,m,1210));
  m.workers=4;assert.notDeepEqual(frame(scene,m,1000),frame(scene,m,1210));
  assert.deepEqual(frame(scene,m,1000,true),frame(scene,m,1210,true));
  assert.deepEqual(m,{...original,workers:4});
 }
});
test('startup is brief, does not replay on initial completed state, and tracks off-floor completion',()=>{
 const m={id:'machine',number:1,floor:0,x:248,y:200,progress:0,workers:0,done:false},scene={};
 frame(scene,m,1000);m.done=true;m.progress=1;frame(scene,m,1100);assert.equal(scene.machineStartup.get(m.id),1100);
 frame(scene,m,1600);assert.equal(scene.machineStartup.size,0);
 const initial={};frame(initial,m,1800);assert.equal(initial.machineStartup.size,0);
 m.done=false;frame(scene,{...m,floor:1},2000);m.done=true;frame(scene,{...m,floor:1},2100);frame(scene,m,2700);assert.equal(scene.machineStartup.size,0);
});

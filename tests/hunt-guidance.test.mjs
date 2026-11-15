import {test} from 'node:test';
import assert from 'node:assert/strict';
import {electrical,nearestBreaker,nextTurn,abilityGuide} from '../src/hunt-guidance.js';
import {routeTo} from '../src/hunt-navigation.js';
import {machines} from '../hunt-world.mjs';
test('blackout guidance routes every area toward the dedicated Electrical room',()=>{
 for(const m of machines){const p=nearestBreaker(m.point);assert.equal(p.floor,0);assert.ok(routeTo(m.point,p).length, m.id);assert.ok(p.title.includes('breaker'));}
});
test('arrows follow cardinal route and disappear at arrival',()=>{
 assert.equal(nextTurn({x:10,y:10},[{x:11,y:11},{x:30,y:10}]),'right');
 assert.equal(nextTurn({x:10,y:10},[{x:10,y:30}]),'down');
 assert.equal(nextTurn({x:10,y:10},[{x:10,y:10}]),null);
});
test('all classes explain F and report cooldown, resources and status truthfully',()=>{
 const base={role:'Survivor',status:'active',powerAt:0,flashCharges:2,portalsPlaced:0};
 for(const c of ['Photographer','Magician','Escape Artist','Engineer','Hulk']){const g=abilityGuide({...base,class:c},100);assert.equal(g.ready,true);assert.match(g.hint,/F/);}
 assert.equal(abilityGuide({...base,class:'Hulk',hulkUsed:true},100).ready,false);
 assert.equal(abilityGuide({...base,class:'Magician',portalsPlaced:2},100).ready,false);
 assert.match(abilityGuide({...base,class:'Photographer',flashCharges:0,flashNext:5100},100).status,/5s/);
 assert.match(abilityGuide({...base,class:'Engineer',powerAt:12100},100).status,/12s/);
 assert.match(abilityGuide({...base,hidden:'wardrobe'},100).status,/Leave/);
 assert.match(abilityGuide({...base,status:'carried'},100).status,/wiggle/);
 assert.equal(abilityGuide({...base,role:'Killer'},100,'hunt',1000).ready,false);
});

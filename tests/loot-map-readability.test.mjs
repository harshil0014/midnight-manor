import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapLandmarks} from '../src/hunt-radar.js';
import {lootLabels} from '../src/loot-readability.js';
import {drawerSites,tables} from '../hunt-world.mjs';
test('map fixtures reveal static locations, never remote stock or table occupancy',()=>{
 const s={position:{floor:0},me:{keys:0},tables:tables.map(t=>({...t,occupied:'secret-player'})),drawers:drawerSites.map(d=>({...d,empty:true})),chests:[]};
 const marks=mapLandmarks(s,0);assert(marks.some(m=>m.kind==='table'));assert(marks.some(m=>m.kind==='drawer'));
 assert(marks.every(m=>m.floor===0&&!('occupied'in m)&&!('empty'in m)));
 assert.deepEqual(marks,mapLandmarks({...s,tables:[],drawers:[]},0));
 assert(!marks.some(m=>m.kind==='chest'));
 assert.equal(mapLandmarks({...s,chests:[{id:'visible',floor:0,x:400,y:300,opened:false},{id:'other-floor',floor:1,x:400,y:300,opened:false},{id:'opened',floor:0,x:500,y:300,opened:true}]},0).filter(m=>m.kind==='chest').length,1);
});
test('world loot labels use only authorized visible packets and distinguish drawers, empty storage and locked/open chests',()=>{
 const d=drawerSites.find(d=>d.floor===0),s={position:{floor:0},me:{keys:0},drawers:[{...d,empty:false}],chests:[{id:'c',floor:0,x:400,y:300,opened:false}]};
 assert.deepEqual(lootLabels(s).map(l=>l.text),['KEY DRAWER','LOCKED CHEST']);
 assert.equal(lootLabels({...s,me:{keys:1}})[1].text,'CHEST · E');
 assert.deepEqual(lootLabels({...s,drawers:[{...d,empty:true}],chests:[{...s.chests[0],opened:true}]}).map(l=>l.text),['EMPTY','OPENED']);
 assert.deepEqual(lootLabels({...s,drawers:[],chests:[]}),[]);
 assert.deepEqual(lootLabels({...s,position:{floor:2}}),[]);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';

import {create,addPlayer,act,view,movePlayer} from '../hunt.mjs';
import {drawerSites,machines,fits} from '../hunt-world.mjs';
import {audibleSounds,emitSound,footMaterial} from '../hunt-sound.mjs';
import {focusBounds} from '../src/interaction-focus.js';

function setup(name){const r=create(name,1000);for(let i=0;i<3;i++)addPlayer(r,'Guest '+i,false,1000);act(r,r.players[0],{action:'setKiller',target:r.players[1].id},1000);act(r,r.players[0],{action:'start'},1000);r.positions[r.players[0].id]={floor:1,x:280,y:408,dir:'right'};return r;}

test('sound projection is coarse, short-lived, same-floor and muffled without leaking sources',()=>{
 const r={},at=1000,p={floor:1,x:232,y:408};
 emitSound(r,'wood',{...p,x:260},at);
 assert.deepEqual(Object.keys(audibleSounds(r,p,at)[0]).sort(),['kind','muffled','pan','seq','volume']);
 assert.equal(audibleSounds(r,p,at,()=>true)[0].pan,.65);
 assert(audibleSounds(r,p,at,()=>false)[0].volume<audibleSounds(r,p,at,()=>true)[0].volume);
 assert.equal(audibleSounds(r,{...p,floor:0},at).length,0);
 assert.equal(audibleSounds(r,{...p,x:100},at).length,0);
 assert.equal(audibleSounds(r,p,at+651).length,0);
});
test('ordinary walking emits local footsteps; hidden and ghost movement do not',()=>{
 const r=setup('Walker'),p=r.players[0];p.connected=true;
 for(let i=0;i<6;i++)movePlayer(r,p,1,0,.05,12000+i*50);
 assert(r.sounds?.some(s=>s.kind==='wood'));assert.equal(footMaterial(r.positions[p.id]),'wood');
 const count=r.soundSeq;p.hidden='wardrobe';movePlayer(r,p,1,0,.1,13000);assert.equal(r.soundSeq,count);
 p.hidden=null;p.status='eliminated';for(let i=0;i<6;i++)movePlayer(r,p,1,0,.05,14000+i*50);assert.equal(r.soundSeq,count);
});
test('focus selects usable furniture only and suppresses empty/hidden/inactive targets',()=>{
 const r=setup('Focus'),p=r.players[0],d=drawerSites.find(d=>d.object==='librarydesk');r.positions[p.id]={...d};
 const s=view(r,p,12000),c={action:'interact',object:d.id};assert(focusBounds(s,c));
 assert.equal(focusBounds(s,{...c,action:'drawerInfo'}),null);
 assert.equal(focusBounds({...s,me:{...s.me,hidden:'wardrobe'}},c),null);
 assert.equal(focusBounds({...s,position:{...s.position,floor:0}},c),null);
});

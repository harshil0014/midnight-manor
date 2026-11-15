import {test} from 'node:test';
import assert from 'node:assert/strict';
import PF from 'pathfinding';
import {rooms,objects,maps,sightMaps,spawn,machines,tables,drawerSites,wardrobes,passageNodes,interactionPoint,fits,TILE} from '../hunt-world.mjs';
import {roomLanes} from '../room-layouts.mjs';
const solid=o=>!['stairs','rug','rangoli','vent'].includes(o.type);
const path=(floor,a,b,grid=maps[floor])=>new PF.AStarFinder({allowDiagonal:false}).findPath(a.x>>4,a.y>>4,b.x>>4,b.y>>4,new PF.Grid(grid));
function exits(room){
 const inside=(x,y)=>room.rects.some(q=>x>=q.x&&x<q.x+q.w&&y>=q.y&&y<q.y+q.h),edges=new Map();
 for(const q of room.rects)for(let y=q.y;y<q.y+q.h;y++)for(let x=q.x;x<q.x+q.w;x++)if(maps[room.floor][y][x]===0)for(const[dx,dy]of [[0,1],[1,0],[0,-1],[-1,0]])if(!inside(x+dx,y+dy)&&maps[room.floor]?.[y+dy]?.[x+dx]===0)edges.set(`${x+dx},${y+dy}`,[x+dx,y+dy]);
 const groups=[];while(edges.size){const first=edges.values().next().value,todo=[first],group=[];edges.delete(first.join(','));while(todo.length){const p=todo.pop();group.push(p);for(const[key,next]of edges)if(Math.abs(next[0]-p[0])+Math.abs(next[1]-p[1])===1){todo.push(next);edges.delete(key);}}groups.push(group);}return groups;
}
test('room furnishing leaves broad walking lanes and all usable furniture on the floor',()=>{
 for(const[floor,name,x,y,w,h]of roomLanes)for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)assert(fits(floor,xx*TILE+8,yy*TILE+8),`${name}: blocked lane ${xx},${yy}`);
 for(const o of objects.filter(o=>o.floor<2&&solid(o)&&!o.mounted))for(let y=o.y;y<o.y+o.h;y++)for(let x=o.x;x<o.x+o.w;x++)assert.equal(sightMaps[o.floor][y][x],0,`${o.id}: furniture outside room`);
});
test('every indoor non-stair room keeps alternative exits even if one exit is camped',()=>{
 for(const room of rooms.filter(r=>r.floor<2&&r.kind!=='stairs')){
  const groups=exits(room);assert(groups.length>=2,`${room.name}: needs two separated exits`);
  const points=[];for(const q of room.rects)for(let y=q.y;y<q.y+q.h;y++)for(let x=q.x;x<q.x+q.w;x++)if(fits(room.floor,x*TILE+8,y*TILE+8))points.push({x:x*TILE+8,y:y*TILE+8});
  // Every walkable interior tile must still reach another exit when any one is blocked.
  for(const group of groups){const grid=maps[room.floor].map(row=>[...row]);for(const[x,y]of group)grid[y][x]=1;const goal=groups.find(g=>g!==group)[0];for(const p of points)assert(path(room.floor,p,{x:goal[0]*16+8,y:goal[1]*16+8},grid).length,`${room.name}: trapped tile ${p.x/16},${p.y/16}`);}
 }
});
test('rearranged drawers, wardrobes, machines and capture tables remain reachable',()=>{
 for(const floor of [0,1,2]){
  const root=machines.find(m=>m.floor===floor);
  const goals=[...machines,...tables,...drawerSites,...wardrobes.map(interactionPoint),...passageNodes.map(interactionPoint)].filter(p=>p?.floor===floor);
  for(const p of goals){assert(fits(floor,p.x,p.y),p.id||'fixture');assert(path(floor,root,p).length,`${p.id||'fixture'} unreachable on floor ${floor}`);}
 }
});
test('machines and capture tables have dedicated floor space apart from furniture',()=>{
 for(const fixture of [...machines,...tables])for(const o of objects.filter(o=>o.floor===fixture.floor&&solid(o))){
  const dx=Math.max(o.x*TILE-fixture.x,0,fixture.x-(o.x+o.w)*TILE);
  const dy=Math.max(o.y*TILE-fixture.y,0,fixture.y-(o.y+o.h)*TILE);
  assert(Math.hypot(dx,dy)>=14,`${fixture.id} crowds ${o.id}`);
 }
});

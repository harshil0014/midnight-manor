import {objects,doors,machines,panels,arches,exitDoors,los} from '../hunt-world.mjs';
export function focusBounds(s,c){
  if(!c?.object||s.phase!=='hunt'||s.me.status!=='active'||s.me.hidden||s.me.channel||['drawerInfo','escapeInfo'].includes(c.action))return null;
  const drawer=s.drawers?.find(d=>d.id===c.object),o=objects.find(o=>o.id===(drawer?.object||c.object));
  let b;
  if(o)b={floor:o.floor,x:o.x*16-1,y:o.y*16-2,w:o.w*16+2,h:o.h*16+3};
  else {
    const q=[...doors,...machines,...panels,...arches,...exitDoors,...(s.chests||[]),...(s.portals||[])].find(q=>q.id===c.object);
    if(!q)return null;
    b={floor:q.floor,x:q.x-(q.w||20)/2-1,y:q.y-(q.h||20)/2-2,w:(q.w||20)+2,h:(q.h||20)+3};
  }
  const edge={floor:b.floor,x:Math.max(b.x,Math.min(s.position.x,b.x+b.w)),y:Math.max(b.y,Math.min(s.position.y,b.y+b.h))};
  return los(s.position,edge)?b:null;
}
export function paintFocus(g,s,c){
  g.clear();const b=focusBounds(s,c);if(!b)return;
  // One quiet pixel at native resolution, no glow or pulsing.
  g.lineStyle(.7,0xe8dfb9,.32).strokeRect(b.x,b.y,b.w,b.h);
}

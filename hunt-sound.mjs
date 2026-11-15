import {zoneAt,inGrass,los} from './hunt-world.mjs';
export function emitSound(r,kind,point,now){
  r.soundSeq=(r.soundSeq||0)+1;
  r.sounds=[...(r.sounds||[]).filter(s=>now-s.at<700),{seq:r.soundSeq,kind,at:now,floor:point.floor,x:point.x,y:point.y}].slice(-48);
}
export function footMaterial(point){
  if(inGrass(point))return 'grass';
  return ['music','bedroom','library','study','dining','stable'].includes(zoneAt(point)?.kind)?'wood':'tile';
}
export function doorSound(point){
  const kinds=[[-20,0],[20,0],[0,-20],[0,20]].map(([dx,dy])=>zoneAt({...point,x:point.x+dx,y:point.y+dy})?.kind);
  return kinds.some(k=>['security','electrical'].includes(k))?'doorMetal':kinds.some(k=>['garden','terrace','gallery'].includes(k))?'doorGlass':'doorWood';
}
// The packet contains no source identity or position; only three coarse pan bands.
export function audibleSounds(r,listener,now,clear=(a,b)=>los(a,b)){
  return (r.sounds||[]).filter(s=>s.floor===listener.floor&&now-s.at<650&&now>=s.at).flatMap(s=>{
    const d=Math.hypot(s.x-listener.x,s.y-listener.y);if(d>88)return [];
    const muffled=!clear(listener,s),volume=(1-d/100)*(muffled?.24:1);
    if(volume<.09)return [];
    return [{seq:s.seq,kind:s.kind,pan:Math.abs(s.x-listener.x)<12?0:s.x<listener.x?-.65:.65,volume:Math.max(.25,Math.round(volume*4)/4),muffled}];
  });
}

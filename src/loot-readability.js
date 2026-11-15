import {objects,TILE} from '../hunt-world.mjs';
export function lootLabels(s){
  const labels=[];
  for(const d of s.drawers||[]){
    if(d.floor!==s.position.floor)continue;
    const o=objects.find(o=>o.id===d.object);if(!o)continue;
    labels.push({id:d.id,x:(o.x+o.w/2)*TILE,y:(o.y+o.h)*TILE+7,text:d.empty?'EMPTY':'KEY DRAWER',color:d.empty?'#aab6ac':'#f1d797'});
  }
  for(const c of s.chests||[]){
    if(c.floor!==s.position.floor)continue;
    labels.push({id:c.id,x:c.x,y:c.y+10,text:c.opened?'OPENED':s.me.keys?'CHEST · E':'LOCKED CHEST',color:c.opened?'#aab6ac':'#cae2ce'});
  }
  return labels;
}
export function updateLootLabels(scene,s){
  scene.lootLabels ||= new Map();const used=new Set();
  for(const item of lootLabels(s)){
    used.add(item.id);let label=scene.lootLabels.get(item.id);
    if(!label){label=scene.add.text(item.x,item.y,item.text,{fontFamily:'monospace',fontSize:'5px',resolution:2,backgroundColor:'#253b40',padding:{x:2,y:1}}).setOrigin(.5,0).setDepth(950);scene.lootLabels.set(item.id,label);}
    label.setText(item.text).setColor(item.color).setPosition(item.x,item.y);
  }
  for(const [id,label]of scene.lootLabels)if(!used.has(id)){label.destroy();scene.lootLabels.delete(id);}
}

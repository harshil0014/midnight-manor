import {doors} from '../hunt-world.mjs';

// Derive effects from the already-authorized seat snapshot. No new disclosure,
// input locks, timers or gameplay state are introduced by this presentation layer.
export function collectFeedback(before,after) {
  if(!before||before.code!==after.code||after.phase==='lobby')return [];
  const effects=[],self=after.position;
  const add=(kind,p=self,actor=null)=>effects.push({kind,floor:p.floor,x:p.x,y:p.y,actor,duration:kind==='travel'?320:260});
  const hud=kind=>effects.push({kind,hud:true,duration:180});
  if(before.dark!==after.dark)hud(after.dark?'danger':'good');
  if(before.phase!==after.phase)hud('good');
  const old=before.me,me=after.me;
  if(me.channel && (me.channel.started!==old.channel?.started || me.channel.kind!==old.channel?.kind)) {
    const kind=me.channel.kind;
    if(!['strike'].includes(kind))add(['damageMachine','search','chain'].includes(kind)?'impact':['travel','portal','arch','escape'].includes(kind)?'travel':'action',self,me.id);
  }
  if(me.repairing && me.repairing!==old.repairing)add('action',self,me.id);
  if(['keys','sensors','whip','battery'].some(k=>(me[k]||0)>(old[k]||0))) {add('loot',self,me.id);hud('loot');}
  if(me.lightOn!==old.lightOn)add('action',self,me.id);
  if(after.toast && after.toast!==before.toast){add('action',self,me.id);hud('loot');}
  if(me.hidden!==old.hidden)add('travel',self,me.id);
  if(me.powerAt>old.powerAt && !me.hulkReadyAt)add('power',self,me.id);
  if((self.floor!==before.position.floor || Math.hypot(self.x-before.position.x,self.y-before.position.y)>65)&&!(self.floor!==before.position.floor&&(self.floor===2||before.position.floor===2)))add('travel',self,me.id);
  const previousAvatars=new Map((before.avatars||[]).map(p=>[p.id,p]));
  for(const p of after.avatars||[]){
    const previous=previousAvatars.get(p.id);if(!previous)continue;
    if(p.status!==previous.status){add(['downed','captured','carried','eliminated','lost'].includes(p.status)?'impact':'good',p,p.id);if(p.id===me.id)hud(['downed','captured','eliminated','lost'].includes(p.status)?'danger':'good');}
    if(p.stunUntil>previous.stunUntil)add('power',p,p.id);
    if(p.carrying!==previous.carrying)add('action',p,p.id);
  }
  // The local player can disappear from the ordinary avatar list on escape.
  if(me.status!==old.status && !(after.avatars||[]).some(p=>p.id===me.id)) {add('travel',self);hud(me.status==='escaped'?'good':'danger');}
  function changes(key,fn){const prev=new Map((before[key]||[]).map(o=>[o.id,o]));for(const o of after[key]||[])fn(o,prev.get(o.id));}
  changes('machines',(m,p)=>{if(!p)return;if(m.done&&!p.done)add('good',m);else if(m.progress<p.progress-.015)add('impact',m);});
  changes('chests',(o,p)=>{if(p&&!p.opened&&o.opened)add('loot',o);});
  changes('drawers',(o,p)=>{if(p&&o.openUntil>p.openUntil)add('loot',o);});
  changes('sensors',(o,p)=>{if(!p||(!p.triggered&&o.triggered))add('power',o);});
  changes('portals',(o,p)=>{if(!p)add('travel',o);});
  const wasClosed=new Set((before.closedDoors||[]).map(d=>d.id)),closed=new Set((after.closedDoors||[]).map(d=>d.id));
  for(const d of doors)if(wasClosed.has(d.id)!==closed.has(d.id))add('action',d);
  const lastSeq=Math.max(0,...(before.events||[]).map(e=>e.seq));
  for(const e of after.events||[])if(e.seq>lastSeq&&after.serverNow-e.at<800){
    if(['blackout','down','machineDamage','eliminated','hulk-defeat'].includes(e.type))hud('danger');
    else if(['machine','power','rescue','escape','gates','end','return'].includes(e.type))hud('good');
    else if(!['flash','strike','whip','hulk','injection','pressure'].includes(e.type))hud('power');
  }
  const seen=new Set();return effects.filter(e=>{const id=[e.kind,e.hud,e.floor,e.x,e.y,e.actor].join(':');if(seen.has(id))return false;seen.add(id);return true;});
}

const colors={good:0xb8e3a0,impact:0xf2ad7c,loot:0xf1d38a,power:0xb9b1ec,travel:0xa8ddd1,action:0xc8dbd0};
export function paintFeedback(g,effects,time,floor,reduced=false){
  g.clear();
  for(const e of effects){
    if(e.floor!==floor||time<e.at||time>e.at+e.duration)continue;
    const progress=(time-e.at)/e.duration,color=colors[e.kind]||colors.action,alpha=(1-progress)*.8;
    g.lineStyle(1,color,alpha).strokeCircle(e.x,e.y-4,reduced?9:5+progress*13);
    if(!reduced && e.kind==='good')g.lineStyle(2,color,alpha).beginPath().moveTo(e.x-5,e.y-14-progress*6).lineTo(e.x-1,e.y-10-progress*6).lineTo(e.x+6,e.y-18-progress*6).strokePath();
    if(!reduced && e.kind==='impact')g.lineStyle(2,color,alpha).beginPath().moveTo(e.x-7+progress*4,e.y-17).lineTo(e.x+6+progress*4,e.y-4).strokePath();
    if(!reduced && e.kind==='loot')g.fillStyle(color,alpha).fillRect(e.x-1,e.y-20-progress*8,3,6).fillRect(e.x-3,e.y-18-progress*8,7,2);
    if(!reduced)for(let i=0;i<5;i++){
      const angle=i*Math.PI*2/5,spread=5+progress*14;
      const x=Math.round(e.x+Math.cos(angle)*spread),y=Math.round(e.y-7+Math.sin(angle)*spread-progress*3);
      g.fillStyle(color,alpha).fillRect(x,y,2,2);
    }
  }
}
export function feedbackScale(effects,id,time,reduced=false){
  if(reduced)return 1;
  const active=effects.findLast(e=>e.actor===id&&time>=e.at&&time<e.at+e.duration);
  return active?1+Math.sin(Math.PI*(time-active.at)/active.duration)*.06:1;
}
export function feedbackAngle(effects,id,time,reduced=false){
  if(reduced)return 0;
  const e=effects.findLast(e=>e.actor===id&&time>=e.at&&time<e.at+e.duration);
  return e?Math.sin(Math.PI*(time-e.at)/e.duration)*(e.kind==='impact'?10:e.kind==='action'?5:0):0;
}

import {sightMaps,TILE,doors,breakWalls} from '../hunt-world.mjs';
export function channelFraction(c,now){return c?Math.max(0,Math.min(1,(now-c.started)/Math.max(1,c.until-c.started))):0;}

// Telegraphs are drawn only for the avatars already authorized by the server.
export function strikeOutline(p,state){
  if(!p.strike)return [];
  const aim={up:-Math.PI/2,down:Math.PI/2,left:Math.PI,right:0}[p.strike.direction];
  if(aim===undefined)return [];
  const span=Math.acos(p.strike.whip ? .78 : .3),range=p.strike.range||36;
  const blocks=[...doors.filter(d=>(state.closedDoors||[]).some(c=>c.id===d.id)),...breakWalls.filter(w=>!(state.broken||[]).includes(w.id))].filter(b=>b.floor===p.floor);
  return Array.from({length:17},(_,i)=>{
    const angle=aim-span+i*span/8,dx=Math.cos(angle),dy=Math.sin(angle);let distance=0;
    for(let d=2;d<=range;d+=2){const x=p.x+dx*d,y=p.y+dy*d;if(sightMaps[p.floor]?.[Math.floor(y/TILE)]?.[Math.floor(x/TILE)]!==0||blocks.some(b=>Math.abs(x-b.x)<b.w/2&&Math.abs(y-b.y)<b.h/2))break;distance=d;}
    return {x:Math.round(p.x+dx*distance),y:Math.round(p.y+dy*distance)};
  });
}
export function drawChaseFeedback(g,state,now,reduced=false){
  for(const p of state.avatars){
    if(p.floor!==state.position.floor)continue;
    const rescue=channelFraction(p.assist,now);
    if(p.role==='Killer'&&p.resistUntil>now)g.lineStyle(1,0xd9a57e,.65).strokeRect(p.x-7,p.y-24,14,3);
    if(p.repairing&&p.status==='active'){
      const beat=reduced?0:Math.floor(now/160)%2;
      g.fillStyle(0xd8c399,p.grass?.45:.9).fillRect(p.x-8,p.y-10-beat,3,2).fillRect(p.x+5,p.y-9+beat,3,2);
    }
    if(p.travelling){
      const progress=channelFraction(p.travelling,now);
      g.lineStyle(1,0xacc9bc,.7).strokeRect(p.x-7,p.y-2,14,4);
      if(!reduced)g.fillStyle(0xcbb786,.7).fillRect(p.x-8,p.y-4-progress*5,3,1).fillRect(p.x+6,p.y-4-progress*5,3,1);
    }
    if(p.status==='captured'){
      const gap=2+rescue*7;
      for(const side of [-1,1])for(let i=0;i<3;i++)g.lineStyle(1,rescue?0xb5d8ce:0xe8bc6e,.9).strokeRect(p.x+side*(gap+4)-2,p.y-12+i*6,4,5);
      if(!p.assist)g.fillStyle(0xf2d382).fillRect(p.x-2,p.y-1,5,6);
    }
    if(['captured','downed'].includes(p.status)){
      for(let i=0;i<3;i++)g.fillStyle(i<(p.captures||0)?0xd18b79:0x657879).fillRect(p.x-6+i*5,p.y+14,3,2);
      if(p.assist){
        g.fillStyle(0x243d44).fillRect(p.x-12,p.y-29,24,5);
        g.fillStyle(0xb1d7ba).fillRect(p.x-11,p.y-28,Math.round(22*rescue),3);
        if(!reduced){const lift=Math.floor(now/140)%3;g.fillStyle(0xcbe5c4).fillRect(p.x+13,p.y-18-lift,1,5).fillRect(p.x+11,p.y-16-lift,5,1);}
      }
    }
    if(p.strike){
      const points=strikeOutline(p,state),progress=channelFraction(p.strike,now);
      if(!points.length)continue;
      g.lineStyle(1,p.strike.whip?0xecc89a:0xe2a78a,.5).beginPath().moveTo(points[0].x,points[0].y);
      for(const q of points.slice(1))g.lineTo(q.x,q.y);g.strokePath();
      if(!reduced)for(const q of points.filter((_,i)=>i%2===0))g.fillStyle(0xf3d5a0,.75).fillRect(Math.round(p.x+(q.x-p.x)*progress),Math.round(p.y+(q.y-p.y)*progress),1,1);
    }
  }
}

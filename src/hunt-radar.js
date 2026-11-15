import { rooms, passages, TILE, areaNames, visibilityPolygon, doors, tables, drawerSites, arches } from '../hunt-world.mjs';

// Fixed fixtures are public geography; chest positions come only from observed loot.
// No table occupancy or remote drawer stock is exposed on the map.
export function mapLandmarks(s,floor){
  return [...tables.map(q=>({...q,kind:'table',letter:'T'})),...arches.map(q=>({...q,kind:'door',letter:'D'})),...drawerSites.map(q=>({...q,kind:'drawer',letter:'K'})),...(s.chests||[]).filter(q=>!q.opened).map(q=>({...q,kind:'chest',letter:'C'}))].filter(q=>q.floor===floor);
}

// Tracking consumes only the server's explicitly authorized liveMap projection.
export function radarPins(s) {
  return (s.liveMap || []).filter(p => p.floor === s.position.floor &&
    (p.id === s.me.id || (!s.dark && s.me.role !== 'Killer' && p.role !== 'Killer')));
}

export function drawRadar(canvas, s, floor = s.position.floor, overview = false) {
  if (!canvas) return;
  const limited = s.dark && s.me.role !== 'Killer';
  if(limited){floor=s.position.floor;overview=false;}
  const g = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  const readScale=Math.min(4,w/(canvas.clientWidth||w));
  const areas = [...rooms.filter(r => r.floor === floor).flatMap(r => r.rects),
    ...passages.filter(r => r.floor === floor)];
  const x0 = Math.min(...areas.map(r => r.x)) * TILE - 12,
    y0 = Math.min(...areas.map(r => r.y)) * TILE - 12,
    x1 = Math.max(...areas.map(r => r.x + r.w)) * TILE + 12,
    y1 = Math.max(...areas.map(r => r.y + r.h)) * TILE + 12;
  const scale = overview ? Math.min(w / (x1-x0), h / (y1-y0)) : w / 390;
  const cx = overview ? (x0+x1)/2 : s.position.x,
    cy = overview ? (y0+y1)/2 : s.position.y;
  const point = p => ({x: w/2+(p.x-cx)*scale, y:h/2+(p.y-cy)*scale});
  g.fillStyle='#101c24'; g.fillRect(0,0,w,h);
  g.save();
  if(limited){
    const mask=visibilityPolygon(s.position,64,doors.filter(d=>(s.closedDoors||[]).some(q=>q.id===d.id)));
    g.beginPath();const start=point(mask[0]);g.moveTo(start.x,start.y);
    for(const q of mask.slice(1)){const p=point(q);g.lineTo(p.x,p.y);}
    g.closePath();g.clip();
  }
  g.save(); g.translate(w/2-cx*scale,h/2-cy*scale); g.scale(scale,scale);
  g.lineJoin='round';
  for(const r of passages.filter(r=>r.floor===floor)) {
    g.fillStyle='#92a7a4'; g.fillRect(r.x*TILE,r.y*TILE,r.w*TILE,r.h*TILE);
  }
  const palette={library:'#7d7ba0',bedroom:'#a8869f',kitchen:'#b49a6a',music:'#8e819b',courtyard:'#779872',security:'#628fa1',electrical:'#9ba36d'};
  for(const r of rooms.filter(r=>r.floor===floor)) for(const q of r.rects) {
    g.fillStyle=palette[r.kind]||'#7f9691';
    g.fillRect(q.x*TILE,q.y*TILE,q.w*TILE,q.h*TILE);
    g.strokeStyle='#e2e7d3';g.lineWidth=1.5/scale;
    g.strokeRect(q.x*TILE,q.y*TILE,q.w*TILE,q.h*TILE);
  }
  g.restore();
  // Fixed screen-size text and markers stay legible at every map scale.
  for(const r of rooms.filter(r=>r.floor===floor)) {
    const p=point({x:(r.x+r.w/2)*TILE,y:(r.y+r.h/2)*TILE});
    if(p.x<10||p.x>w-10||p.y<12||p.y>h-12)continue;
    const font=overview?Math.max(16,Math.round(8*readScale)):24;
    g.font=`bold ${font}px monospace`;g.textAlign='center';
    g.lineWidth=4;g.strokeStyle='#172631';g.fillStyle='#f8f1d5';
    const name=r.name.replace('Rangoli ','').replace(' room','').replace(' hall','');
    const words=overview&&readScale>2&&name.length>11&&name.includes(' ')?[name.slice(0,name.lastIndexOf(' ')),name.slice(name.lastIndexOf(' ')+1)]:[name];
    words.forEach((text,i)=>{const y=p.y+(i-(words.length-1)/2)*font*1.2;g.strokeText(text,p.x,y);g.fillText(text,p.x,y);});
  }
  for(const mark of mapLandmarks(s,floor)){
    const p=point(mark),size=overview?Math.max(17,Math.round(12*readScale)):23;
    if(p.x<size||p.x>w-size||p.y<size||p.y>h-size)continue;
    g.fillStyle={table:'#9c5965',drawer:'#a7813e',chest:'#437d7c',door:'#756246'}[mark.kind];g.fillRect(p.x-size/2,p.y-size/2,size,size);
    g.strokeStyle='#e8dfba';g.lineWidth=overview?1:2;g.strokeRect(p.x-size/2,p.y-size/2,size,size);
    g.fillStyle='#fff1c9';g.font=`bold ${overview?Math.round(size*.72):17}px monospace`;g.textAlign='center';g.fillText(mark.letter,p.x,p.y+size*.26);
  }
  const pins=(overview?s.liveMap||[]:radarPins(s)).filter(p=>p.floor===floor &&
    (p.id===s.me.id||(!s.dark&&s.me.role!=='Killer'&&p.role!=='Killer')));
  for(const pin of pins.filter(p=>p.id!==s.me.id)) {
    const p=point(pin);if(p.x<6||p.x>w-6||p.y<6||p.y>h-6)continue;
    g.beginPath();g.arc(p.x,p.y,overview?8:12,0,Math.PI*2);
    g.fillStyle='#61e5df';g.fill();
    g.strokeStyle='#101c24';g.lineWidth=overview?2:4;g.stroke();
    if(overview){g.font='bold 12px monospace';g.textAlign='center';g.fillStyle='#fff';g.fillText(pin.name,p.x,p.y-12);}
  }
  if(s.position.floor===floor){
    const p=point(s.position),angle={up:0,right:Math.PI/2,down:Math.PI,left:-Math.PI/2}[s.position.dir]||0;
    g.save();g.translate(p.x,p.y);g.rotate(angle);if(!overview)g.scale(2,2);g.beginPath();
    g.moveTo(0,-11);g.lineTo(8,8);g.lineTo(0,4);g.lineTo(-8,8);g.closePath();
    g.fillStyle='#ffe88b';g.fill();g.strokeStyle='#151e29';g.lineWidth=overview?2:4;g.stroke();g.restore();
  }
  g.restore();
  g.textAlign='left';g.font=`bold ${overview?14:22}px monospace`;g.fillStyle='#f5e8ba';g.fillText('N ↑',10,18);
}

export const radarStatus = s => `${areaNames[s.position.floor]} · ${s.me.role==='Killer'?'SELF ONLY':s.dark?'BLACKOUT · NEARBY ONLY':'TEAMMATES ONLY'}`;

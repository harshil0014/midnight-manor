import {
  panels,
  doors,
  breakWalls,
  arches,
  areaNames,
  objects,
} from "../hunt-world.mjs";
// Original integer-pixel props, using the existing game's palette and renderer.
export function drawHuntProps(scene, state, time, now, reducedMotion = false) {
  const g = scene.markers,
    f = state.position.floor,
    R = (x, y, w, h, c) =>
      g.fillStyle(c).fillRect(Math.round(x), Math.round(y), w, h);
  for(const o of objects.filter(o=>o.floor===f&&o.type==="fountain"&&o.id!=="well2")){
    const w=o.w*16,h=o.h*16;
    for(let i=0;i<2;i++){
      const drift=(Math.floor(time/600)+i*11)%Math.max(1,w-26);
      R(o.x*16+12+drift,o.y*16+Math.floor(h*.65)+i*2,4,1,0xb5d8ce);
    }
    if(o.floor===2){
      const cx=(o.x+o.w/2)*16,cy=(o.y+o.h/2)*16;
      R(cx-2,cy-15,4,12,0x91c9cc);R(cx-1,cy-18,2,17,0xd3e9de);
      for(const side of [-1,1])for(let i=0;i<4;i++){
        const drift=reducedMotion?0:Math.floor(time/110)%3;
        R(cx+side*(i*2+2),cy-16+i*i+drift,2,2,0xb8ded7);
      }
    }
  }
  if(scene.machineRoom!==state.code){scene.machineRoom=state.code;scene.machineHistory=new Map();scene.machineStartup=new Map();}
  scene.machineHistory ||= new Map();scene.machineStartup ||= new Map();
  // Track all floors so returning to a room never replays an old startup.
  for(const m of state.machines){
    if(scene.machineHistory.has(m.id)&&!scene.machineHistory.get(m.id)&&m.done)scene.machineStartup.set(m.id,time);
    scene.machineHistory.set(m.id,!!m.done);
    if(time-(scene.machineStartup.get(m.id)??-Infinity)>450)scene.machineStartup.delete(m.id);
  }
  for (const m of state.machines.filter((m) => m.floor === f)) {
    const x = m.x,
      y = m.y;
    const progress=Math.max(0,Math.min(1,m.progress||0)),working=!!m.workers&&!m.done;
    const spin=!reducedMotion&&(working||m.done)?time/650*(.7+progress*2.3):0;
    const beat=!reducedMotion&&working?Math.floor(time/160)%3:0;
    const startup=!reducedMotion&&scene.machineStartup.has(m.id);
    const accent = [0xb38a5f, 0x8ba5a0, 0x8f83a3, 0xb59160][(m.number - 1) % 4];
    R(x - 12, y - 18, 24, 26, 0x344650);
    R(x - 11, y - 17, 22, 24, 0x4d5c65);
    R(x - 10, y - 16, 20, 2, accent);
    // Lit top plane and side casing give the cabinet shallow GBA-style volume.
    R(x - 11, y - 19, 19, 5, 0xc5cfb8);
    R(x + 8, y - 16, 3, 21, 0x354954);
    R(x - 9, y - 18, 15, 1, 0xe2e4c5);
    R(x - 9, y - 13, 18, 15, m.done ? 0x6e9878 : 0x8fa8a9);
    R(x - 7, y - 11, 8, 7, 0x384e53);
    R(x - 6, y - 10, 6, 2, m.done ? 0xbee69b : 0xd4b66b);
    R(x + 3, y - 11, 3, 9, 0x617777);
    for (let i = 0; i < 3; i++) R(x + 3, y - 10 + i * 3, 4, 1, 0xc9d0ad);
    // Dial, separate switches, rivets and a striped service edge.
    g.lineStyle(0.5, 0xd7d7bd).strokeCircle(x - 3, y - 7, 2.5);
    g.lineStyle(0.5, 0xe8c77c)
      .beginPath()
      .moveTo(x - 3, y - 7)
      .lineTo(x - 2, y - 9)
      .strokePath();
    for (const dx of [-9, 9])
      for (const dy of [-15, 4]) R(x + dx, y + dy, 1, 1, 0xc2cabb);
    const style=(m.number-1)%4;
    if(style===0){
      // Copper-wound dynamo: visible coils and a circular rotor.
      R(x-9,y-14,18,16,0x38454c);R(x-8,y-13,4,14,0x9f6849);R(x+4,y-13,4,14,0x9f6849);
      for(let j=0;j<5;j++){R(x-8,y-12+j*3,4,1,0xe0ad6a);R(x+4,y-12+j*3,4,1,0xe0ad6a);}
      g.lineStyle(2,m.done?0x9dc78c:0xb9cec0).strokeCircle(x,y-6,5);
      for(let i=0;i<4;i++)R(x+Math.cos(spin+i*Math.PI/2)*3-1,y-7+Math.sin(spin+i*Math.PI/2)*3,2,2,0xd7b76f);
      R(x-1,y-7,2,2,0xe9d79a);
    }else if(style===1){
      // Pump with blue pipework and a bright pressure gauge.
      R(x-13,y-10,4,15,0x557d8a);R(x-13,y-12,9,4,0x91bbc0);
      R(x+8,y-5,5,10,0x557d8a);R(x+4,y-7,9,3,0x91bbc0);
      R(x-6,y-10,12,11,0x536e76);R(x-4,y-8,8,7,0x809a93);
      g.lineStyle(2,0xe9ddba).strokeCircle(x,y-14,4);
      g.lineStyle(1,0x495d62).beginPath().moveTo(x,y-14).lineTo(x+Math.cos(-2.7+progress*2.2)*3,y-14+Math.sin(-2.7+progress*2.2)*3).strokePath();
      const piston=!reducedMotion&&working?Math.round(Math.sin(spin)*2):0;
      R(x-2,y-7+piston,4,3,0xc5d5bc);
    }else if(style===2){
      // Relay cabinet: ceramic insulators and individual switch lights.
      R(x-8,y-23,3,6,0xa2b8ba);R(x+5,y-23,3,6,0xa2b8ba);
      R(x-9,y-23,5,1,0xe1dfc6);R(x+4,y-23,5,1,0xe1dfc6);
      R(x-8,y-13,16,15,0x334b54);
      for(let j=0;j<3;j++){R(x-6,y-11+j*4,5,2,m.done||progress>=(j+1)*.25?0xa4d89c:0x657371);R(x+3,y-11+j*4,3,2,working&&beat===j?0xf1dfa0:0x83a7ac);}
    }else{
      // Compressor: copper motor housing and a six-spoke fan.
      R(x-10,y-13,20,16,0x8d765c);R(x-8,y-11,16,12,0x344852);
      g.lineStyle(1,0xbcc6b5).strokeCircle(x,y-5,6);
      for(let i=0;i<6;i++)R(x+Math.cos(spin+i*Math.PI/3)*4-1,y-6+Math.sin(spin+i*Math.PI/3)*4,2,2,0xa5bdb8);
      R(x-1,y-6,2,2,0xe3c57f);
    }
    for (let dx = -8; dx < 8; dx += 4) R(x + dx, y + 2, 2, 1, 0xdfbb65);
    // Shared quarter-progress lamps remain readable when no one is working.
    for(let i=0;i<3;i++)R(x-6+i*5,y+5,3,2,m.done||progress>=(i+1)*.25?0xb5dd99:0x384b51);
    R(x - 8, y + 3, 3, 5, 0x48515a);
    R(x + 5, y + 3, 3, 5, 0x48515a);
    R(x - 10, y + 10, 20, 3, 0x263d43);
    R(
      x - 10,
      y + 10,
      Math.floor(20 * m.progress),
      3,
      m.done ? 0xa5ce86 : 0xe3be66,
    );
    if (working) {
      R(x+7,y-17,2,2,reducedMotion||beat===0?0xf4dc97:0xa78e5d);
      if(!reducedMotion){
        const rise=(time/70)%7;
        R(x-5,y-20-rise,1,2,0xd2dfc3);R(x+3,y-22-((rise+3)%7),1,1,0xa9cecb);
      }
    }
    if(startup){
      const p=(time-scene.machineStartup.get(m.id))/450;
      g.lineStyle(1,0xc8e6aa).strokeRect(x-13-p*3,y-24-p*3,26+p*6,34+p*6);
      R(x-5,y-27,3,2,0xc8e6aa);R(x-2,y-25,3,2,0xc8e6aa);R(x+1,y-29,3,5,0xc8e6aa);
    }
    if (m.damaging || (m.damagedAt && now-m.damagedAt < 2500)) {
      R(x-11,y+10,22,3,0xed8870);
      for(let i=0;i<3;i++) R(x-9+i*8,y-23-(Math.floor(time/120+i)%3)*3,2,3,0xffc66f);
    }
    if(m.damagedAt&&!m.done){
      // A bent panel and split casing remain until this machine is completed.
      R(x+7,y-2,5,2,0xc69a76);R(x+9,y,3,4,0x614a42);
      R(x-9,y-13,1,5,0x59433e);R(x-8,y-9,2,1,0x59433e);R(x-7,y-9,1,4,0x59433e);
    }
  }
  for (const q of state.tables.filter((q) => q.floor === f)) {
    const x = q.x,
      y = q.y;
    R(x - 16, y - 7, 32, 19, 0x55484c);
    R(x - 14, y - 10, 28, 18, 0xa58e83);
    R(x - 12, y - 8, 24, 14, 0xbaa99b);
    R(x-11,y-7,22,11,0x805160);R(x-9,y-6,18,2,0xb88480);
    R(x-11,y+4,22,2,0x583c48);
    R(x - 14, y + 8, 4, 7, 0x6c5a52);
    R(x + 10, y + 8, 4, 7, 0x6c5a52);
    for (const dx of [-10, 9]) {
      R(x + dx, y - 8, 2, 13, 0x49555b);
      for (let yy = -7; yy < 6; yy += 4) R(x + dx - 1, y + yy, 4, 2, 0xb9c6c6);
    }
    R(x - 3, y - 6, 6, 6, q.occupied ? 0xa5535b : 0x79646d);
  }
  for (const q of panels.filter((q) => q.floor === f)) {
    const x = q.x,
      y = q.y;
    R(x - 10, y - 19, 20, 25, 0x354751);
    R(x - 9, y - 21, 17, 4, 0xc5cfbe);
    R(x + 7, y - 17, 3, 23, 0x566b72);
    R(x - 8, y - 16, 16, 21, 0x475a60);
    R(x - 6, y - 14, 12, 16, 0xaab8a6);
    // A distinct yellow electrical warning plaque, not another generic cabinet.
    R(x - 8, y - 31, 16, 9, 0x343d46);
    R(x - 7, y - 30, 14, 7, 0xf1c16a);
    R(x, y - 30, 3, 3, 0x3e4245);
    R(x - 2, y - 27, 4, 1, 0x3e4245);
    R(x - 2, y - 26, 2, 3, 0x3e4245);
    for (let i = 0; i < 3; i++) {
      R(x - 4, y - 11 + i * 4, 4, 2, state.dark ? 0xb37162 : 0x689984);
      R(x + 2, y - 11 + i * 4, 2, 3, 0x536769);
    }
  }
  // Chests and searched drawer fronts use imported LPC sprite frames in the scene.
  for (const q of arches.filter((q) => q.floor === f)) {
    const x = q.x,
      y = q.y;
    R(x-17,y-24,5,32,0x8d7150);R(x+12,y-24,5,32,0x8d7150);
    R(x-18,y-28,36,5,0xd4bc87);R(x-15,y-24,3,29,0xe2cca0);R(x+12,y-24,3,29,0xe2cca0);
    R(x-13,y+6,26,6,0xbab49b);R(x-10,y+8,20,2,0xe7d9b2);
    R(x-13,y+13,26,6,0x805c49);
  }
  for (const q of state.exits.filter((q) => q.floor === f)) {
    const x = q.x,
      y = q.y;
    R(x - 15, y - 24, 30, 35, 0x665952);
    R(x - 12, y - 22, 24, 31, state.exitsOpen ? 0x8eaa88 : 0x92734f);
    for (let i = 0; i < 5; i++)
      R(x - 10 + i * 5, y - 20, 2, 27, state.exitsOpen ? 0xadc7a0 : 0xd2b16c);
    if (!state.exitsOpen) R(x - 3, y - 3, 6, 7, 0x4e514a);
  }
  for (const q of state.portals.filter((q) => q.floor === f)) {
    const paired =
      state.portals.filter((x) => x.owner === q.owner).length === 2;
    g.lineStyle(2, paired ? 0xb9a1e4 : 0x78778f).strokeEllipse(
      q.x,
      q.y - 3,
      22,
      30,
    );
    g.lineStyle(1, 0x6f5c9a).strokeEllipse(q.x, q.y - 3, 16, 24);
    R(q.x - 10, q.y + 10, 20, 3, 0xafa29c);
    if(paired)for(let i=0;i<4;i++){
      const phase=time/800+i*Math.PI/2;
      R(q.x+Math.cos(phase)*11-1,q.y-3+Math.sin(phase)*15,2,2,0xd8c4ee);
    }
  }
  for (const q of state.sensors.filter((q) => q.floor === f)) {
    R(q.x - 4, q.y - 4, 8, 8, 0x4d6265);
    R(q.x - 1, q.y - 6, 2, 9, q.triggered ? 0xe5bb76 : 0xa4c6b0);
    if (q.triggered) g.lineStyle(1, 0xd6b66e).strokeCircle(q.x, q.y, 12);
  }
  for (const w of breakWalls.filter(
    (w) => w.floor === f && !state.broken.includes(w.id),
  )) {
    R(w.x - w.w / 2, w.y - w.h / 2, w.w, w.h, 0x9e8070);
    for (let y = w.y - w.h / 2; y < w.y + w.h / 2; y += 8) {
      R(w.x - w.w / 2 + 2, y + 1, w.w - 4, 2, 0xd3b99c);
      R(w.x - 1, y + 3, 2, 4, 0x6e5c53);
    }
  }
  // Physical door leaves use the imported animated LPC door sheet.
  for (const q of state.rustles) {
    R(q.x - 5, q.y - 2, 3, 1, 0xd5e59b);
    R(q.x + 3, q.y + 1, 3, 1, 0xd5e59b);
    R(q.x - 1, q.y - 5, 2, 2, 0xb7cf7d);
  }
}

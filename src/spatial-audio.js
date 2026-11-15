import {los} from '../hunt-world.mjs';
export class SpatialAudio {
  constructor(){this.seq=0;this.room=null;this.humAt=0;}
  play(audio,sound){
    if(!audio||audio.state!=='running')return;
    const t=audio.currentTime,o=audio.createOscillator(),gain=audio.createGain(),pan=audio.createStereoPanner();
    const presets={wood:[130,78,.09,'triangle'],tile:[420,180,.055,'sine'],grass:[90,48,.08,'triangle'],door:[190,65,.17,'triangle'],doorWood:[170,60,.16,'triangle'],doorGlass:[540,380,.13,'sine'],doorMetal:[240,90,.12,'square'],powerOff:[220,45,.24,'triangle'],powerOn:[180,540,.24,'sine'],drawer:[320,140,.12,'triangle'],hum:[74,74,.32,'sine'],hatch:[350,110,.16,'triangle'],hatchHum:[90,82,.25,'sine'],hit:[190,65,.12,'triangle'],miss:[90,45,.09,'sine'],stun:[620,820,.12,'sine'],stunned:[160,75,.15,'triangle'],resisted:[270,230,.1,'triangle'],tap:[420,500,.045,'sine']};
    const [start,end,duration,type]=presets[sound.kind]||presets.wood;
    o.type=type;o.frequency.setValueAtTime(start,t);o.frequency.exponentialRampToValueAtTime(end,t+duration);
    pan.pan.value=sound.pan||0;
    const level=Math.max(.0001,(['hum','hatchHum'].includes(sound.kind)?.009:.027)*(sound.volume||0)*(sound.muffled?.55:1));
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(level,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.connect(gain);gain.connect(pan);pan.connect(audio.destination);o.start(t);o.stop(t+duration+.01);
    o.onended=()=>{o.disconnect();gain.disconnect();pan.disconnect();};
  }
  update(s,audio,enabled){
    const match=s.code+':'+(s.round||0);
    if(this.room!==match){this.room=match;this.seq=0;this.humAt=0;}
    for(const cue of s.sounds||[]){if(cue.seq<=this.seq)continue;this.seq=cue.seq;if(enabled)this.play(audio,cue);}
    if(!enabled||s.phase!=='hunt'||s.me.status!=='active'||s.serverNow-this.humAt<900)return;
    const portal=(s.portals||[]).find(p=>p.floor===s.position.floor&&Math.hypot(p.x-s.position.x,p.y-s.position.y)<38&&(s.portals||[]).filter(q=>q.owner===p.owner).length===2);
    const m=portal||(!s.dark&&s.machines.find(m=>m.floor===s.position.floor&&Math.hypot(m.x-s.position.x,m.y-s.position.y)<45&&(m.workers>0||m.done)));
    if(m){this.humAt=s.serverNow;this.play(audio,{kind:portal?'hatchHum':'hum',pan:m.x<s.position.x?-.4:.4,volume:.5,muffled:!los(s.position,m)});}
  }
}

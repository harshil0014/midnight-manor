import {drawLpcRug} from './lpc-surfaces.js';
import {furnishingRugs} from '../room-layouts.mjs';

// Soft furnishings and architectural finishes only: never new solid obstacles.
// Each room has a material, a furnishing zone and a repeated architectural motif.
export const roomAtmospheres = {
  bedroom:{ink:'#526186',trim:'#c9b6bd',paper:'#ece1dd',motif:'textile'},
  library:{ink:'#654734',trim:'#bda16c',paper:'#d5bd8c',motif:'panels'},
  study:{ink:'#3c6657',trim:'#b7ad77',paper:'#d8dfc4',motif:'panels'},
  music:{ink:'#82465f',trim:'#d1ad78',paper:'#e7c4b0',motif:'acoustic'},
  dining:{ink:'#9b503e',trim:'#deb879',paper:'#f3dfb7',motif:'festoon'},
  kitchen:{ink:'#367f80',trim:'#8bb6a6',paper:'#e4eddf',motif:'tile'},
  gallery:{ink:'#607b83',trim:'#c4b68f',paper:'#e6e7dc',motif:'frames'},
  security:{ink:'#3f6475',trim:'#8aa3a8',paper:'#c4d4d1',motif:'technical'},
  electrical:{ink:'#555f63',trim:'#d8b75d',paper:'#b5c1b4',motif:'technical'},
  courtyard:{ink:'#af784e',trim:'#d9b671',paper:'#f0dfb5',motif:'festoon'},
  terrace:{ink:'#487b86',trim:'#b9c9bb',paper:'#d9e5d5',motif:'lattice'},
  garden:{ink:'#53836a',trim:'#a5ba86',paper:'#dce4bb',motif:'lattice'},
  stairs:{ink:'#8a6047',trim:'#d4b879',paper:'#e5d7b5',motif:'panels'},
  grove:{ink:'#59714b',trim:'#b2bf83',paper:'#a9c48a',motif:'orchard'},
  lawn:{ink:'#4e8070',trim:'#a1be8a',paper:'#b4cc98',motif:'lotus'},
  well:{ink:'#728886',trim:'#c0c8a3',paper:'#e2dcc0',motif:'stone'},
  stable:{ink:'#896b45',trim:'#bba16c',paper:'#d8bd83',motif:'straw'},
  court:{ink:'#a16e4d',trim:'#d0b17c',paper:'#decda5',motif:'stone'},
};

export function drawRoomAtmosphere(g,r){
  const t=roomAtmospheres[r.kind];if(!t)return;
  const x=r.x*16,y=r.y*16,w=r.w*16,h=r.h*16;
  const rect=(a,b,c,d,color)=>{g.fillStyle=color;g.fillRect(Math.round(a),Math.round(b),Math.round(c),Math.round(d));};
  const border=(a,b,c,d,color)=>{rect(a,b,c,2,color);rect(a,b+d-2,c,2,color);rect(a,b,2,d,color);rect(a+c-2,b,2,d,color);};
  g.save();g.globalAlpha=.7;g.beginPath();for(const q of r.rects)g.rect(q.x*16,q.y*16,q.w*16,q.h*16);g.clip();
  // Continuous inlaid perimeter establishes the room as one furnished space.
  border(x+5,y+5,w-10,h-10,t.trim);
  if(['bedroom','library','study','music','dining'].includes(r.kind)){
    const zone=furnishingRugs[r.kind];
    const [rx,ry,rw,rh]=zone?zone.map(v=>v*16):[x+w*.17,y+h*.19,w*.66,h*.62].map(Math.round);
    drawLpcRug(g,rx,ry,rw,rh,r.kind);
    // Reading/music rooms have different cloth centers, even at camera zoom.
    if(r.kind==='library'||r.kind==='study'){
      rect(rx+9,ry+9,rw-18,rh-18,t.ink);border(rx+12,ry+12,rw-24,rh-24,t.trim);
      for(let a=rx+20;a<rx+rw-16;a+=16)rect(a,ry+17,3,3,t.trim);
    }
    if(r.kind==='bedroom'){
      // One coherent textile zone; open floor stays quiet around the bed.
      border(rx+8,ry+8,rw-16,rh-16,t.trim);
    }
    if(r.kind==='music'){
      // Broad performance carpet, with a quiet repeating woven stave border.
      for(let a=rx+10;a<rx+rw-8;a+=12){rect(a,ry+7,2,7,t.trim);rect(a,ry+rh-14,2,7,t.trim);}
    }
    if(r.kind==='dining'){
      // Warm banquet perimeter and a contrasting long serving runner.
      rect(x+16,y+16,10,h-32,t.ink);rect(x+w-26,y+16,10,h-32,t.ink);
      for(let b=y+20;b<y+h-18;b+=12){rect(x+18,b,6,3,t.trim);rect(x+w-24,b,6,3,t.trim);}
    }
  }else if(r.kind==='kitchen'){
    // Clean ceramic border, checker accents, and washable work mats.
    for(let a=x+8;a<x+w-8;a+=32)for(let b=y+8;b<y+h-8;b+=32){rect(a,b,2,2,t.ink);}
    rect(x+24,y+32,w-48,15,t.ink);for(let a=x+28;a<x+w-28;a+=6)rect(a,y+34,2,11,t.trim);
  }else if(r.kind==='gallery'){
    // Pale marble promenade with a dark Greek-key style edge, no central rug.
    for(let b=y+12;b<y+h-10;b+=16){border(x+10,b,10,10,t.ink);border(x+w-20,b,10,10,t.ink);}
    for(let a=x+32;a<x+w-24;a+=32){rect(a,y+20,3,h-40,t.trim);}
  }else if(['security','electrical'].includes(r.kind)){
    rect(x+10,y+10,w-20,11,t.ink);
    if(r.kind==='electrical')for(let a=x+12;a<x+w-12;a+=9)rect(a,y+11,4,9,t.trim);
    else for(let a=x+16;a<x+w-12;a+=16){rect(a,y+13,8,1,t.trim);rect(a+3,y+11,1,5,t.trim);}
    border(x+12,y+27,w-24,h-38,t.ink);
  }else if(r.kind==='courtyard'||r.kind==='court'){
    // Geometric stone inlays make the social courtyard a recognizable landmark.
    const cx=x+w/2,cy=y+h/2;
    for(let i=0;i<4;i++){border(cx-22-i*5,cy-22-i*5,44+i*10,44+i*10,i%2?t.trim:t.ink);}
    for(let a=x+18;a<x+w-12;a+=24){rect(a,y+13,4,4,t.ink);rect(a,y+h-17,4,4,t.ink);}
  }else if(r.kind==='terrace'||r.kind==='garden'){
    // Terracotta walking lanes and planted-edge mosaics, not interior carpet.
    for(let a=x+12;a<x+w-12;a+=16){border(a,y+10,12,12,t.ink);border(a,y+h-22,12,12,t.ink);rect(a+4,y+14,4,4,t.trim);}
    rect(x+12,y+28,2,h-56,t.ink);rect(x+w-14,y+28,2,h-56,t.ink);
  }else if(r.kind==='stairs'){
    rect(x+w*.4,y+8,w*.2,h-16,'#984f48');border(x+w*.4,y+8,w*.2,h-16,t.trim);
  }else if(r.kind==='well'){
    for(let a=x+16;a<x+w-12;a+=32)for(let b=y+16;b<y+h-12;b+=32){border(a,b,24,24,t.trim);}
  }else if(r.kind==='stable'){
    for(let a=x+16;a<x+w-16;a+=24)for(let b=y+16;b<y+h-16;b+=32){rect(a,b,7,1,t.trim);rect(a+3,b-2,1,6,t.trim);}
  }else if(r.kind==='grove'||r.kind==='lawn'){
    for(let a=x+16;a<x+w-12;a+=32)for(let b=y+16;b<y+h-12;b+=32){
      rect(a,b,3,2,t.trim);rect(a+5,b+4,2,2,t.trim);
      if(r.kind==='lawn'){rect(a+1,b-2,1,6,'#d8c1bc');rect(a-1,b,5,2,'#d8c1bc');}
    }
  }
  g.restore();
}

export function drawRoomWallAccent(rect,kind,X,Y,index){
  const t=roomAtmospheres[kind];if(!t)return;
  // Mounted details occupy the wall face only, never fake walk-blocking props.
  if(t.motif==='tile'){
    for(let i=0;i<16;i+=4){rect(X+i,Y+3,3,7,t.paper);rect(X+i+1,Y+5,1,2,t.ink);}
  }else if(t.motif==='technical'){
    rect(X,Y+5,16,2,t.ink);rect(X+3,Y+4,2,4,t.trim);
  }else if(t.motif==='panels'||t.motif==='acoustic'||t.motif==='textile'){
    rect(X+1,Y+2,14,10,t.ink);rect(X+2,Y+3,12,1,t.trim);rect(X+2,Y+3,1,8,t.trim);rect(X+13,Y+3,1,8,t.trim);
    if(t.motif==='acoustic')for(let i=4;i<13;i+=3)rect(X+i,Y+4,1,6,t.trim);
    if(t.motif==='textile'){rect(X+6,Y+5,4,4,t.trim);rect(X+7,Y+4,2,6,t.paper);}
  }else if(t.motif==='lattice'){
    for(let i=2;i<15;i+=4)rect(X+i,Y+2,1,10,t.ink);rect(X,Y+6,16,1,t.trim);
  }else if(t.motif==='frames'){
    rect(X+2,Y+1,12,12,t.ink);rect(X+3,Y+2,10,10,t.trim);rect(X+4,Y+3,8,8,'#9db7bc');rect(X+5,Y+4,2,5,t.paper);
  }else if(t.motif==='festoon'){
    for(let i=1;i<16;i+=4){rect(X+i,Y+2+(index%2),3,3,t.trim);rect(X+i+1,Y+5,1,2,t.ink);}
  }
}

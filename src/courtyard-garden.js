import {drawLpcFloor} from './lpc-surfaces.js';
export function drawCourtyardGarden(g){
  const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
  const plaza=(x,y,w,h)=>{
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)drawLpcFloor(g,'terrace',xx*16,yy*16);
    rect(x*16+2,y*16+2,w*16-4,2,'#c5ab79');rect(x*16+2,(y+h)*16-4,w*16-4,2,'#c5ab79');
    rect(x*16+2,y*16+2,2,h*16-4,'#c5ab79');rect((x+w)*16-4,y*16+2,2,h*16-4,'#c5ab79');
  };
  plaza(31,22,9,8);plaza(11,33,8,6);plaza(29,8,7,7);
  // Narrow planted-edge strips are flat ground decoration, never unseen obstacles.
  for(const [x,y,w]of [[5,4,17],[44,4,16],[6,40,16],[43,40,16]]){
    rect(x*16,y*16,w*16,7,'#617b53');rect(x*16,y*16+7,w*16,2,'#b09a73');
    for(let i=5;i<w*16-4;i+=12){rect(x*16+i,y*16+2,4,3,'#d9ac80');rect(x*16+i+1,y*16+1,2,5,'#ebd1a1');}
  }
  // Stone medallions connect the two broad garden walks.
  for(const [x,y]of [[26,20],[58,20],[26,30],[58,30]]){rect(x*16-4,y*16-4,24,24,'#ae9c77');rect(x*16-2,y*16-2,20,20,'#e2d5af');rect(x*16+4,y*16+4,8,8,'#a7b7a0');}
}

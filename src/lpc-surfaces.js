// Unmodified LPC Floors atlas; attribution and source archive in assets/lpc.
// Artwork composition preserves the existing walkable map and collision grid.
import {materialLayout} from './lpc-material-layout.js';
let floors,walls,materials;
export function setLpcSurfaces(images) { floors = images?.floors; walls=images?.walls; materials=images?.materials; }
export function drawLpcWall(g,kind,x,y,clipRects=null) {
  if(!walls&&!materials)return false;
  const crop={music:[128,2752],library:[0,2464],study:[128,1120],bedroom:[128,1024],
    gallery:[256,2656],security:[0,1024],electrical:[0,1792],dining:[128,2560]}[kind]||[0,2656];
  g.save();
  if(clipRects){g.beginPath();for(const r of clipRects)g.rect(r.x,r.y,r.w,r.h);g.clip();}
  const source=materials?materialLayout.walls[crop.join(',')]:crop;
  g.drawImage(materials||walls,source[0],source[1],32,64,x,y,16,20);g.restore();
  return true;
}
const tiles = {
  music:[192,1216], bedroom:[192,1120], library:[192,1280],
  dining:[64,1184],study:[64,1120],
  kitchen:[0,1600],gallery:[64,1696],courtyard:[64,1600],
  stairs:[64,1600],passage:[64,1600],security:[96,1600],electrical:[192,1664],
  terrace:[64,1632],garden:[64,1600],court:[64,1600],well:[64,1632],stable:[128,1216],
};
export function drawLpcFloor(g,kind,x,y) {
  const tile=tiles[kind];if((!floors&&!materials)||!tile)return false;
  g.imageSmoothingEnabled=false;
  // Quiet material colors keep the imported furniture and actors in the foreground.
  const colors={music:'#c8ad91',bedroom:'#c6bdc7',library:'#bda68a',dining:'#d5bea2',study:'#b5c5b6',kitchen:'#b8d4cc',gallery:'#d0dcd8',courtyard:'#d8d4bb',stairs:'#cbbf9f',passage:'#b8c6bf',security:'#91adb6',electrical:'#aebba8',terrace:'#b6cfd0',garden:'#b9cba9',court:'#c8c3a6',well:'#c7ccb5',stable:'#bda98a'};
  g.fillStyle=colors[kind]||'#bbc9b8';g.fillRect(x,y,16,16);
  const source=materials?materialLayout.floors[tile.join(',')]:tile;
  g.save();g.globalAlpha=.15;
  g.drawImage(materials||floors,source[0],source[1],32,32,x,y,16,16);
  g.restore();
  return true;
}
export function drawLpcRug(g,x,y,w,h,kind) {
  if(!floors&&!materials)return false;
  const sy={music:64,study:384,bedroom:224,library:64,gallery:224}[kind]??544;
  const base=materials?materialLayout.rugs[String(sy)]:[96,sy];
  const edge=8,dest=Math.min(5,w/4,h/4),inside=80;
  const sources=[0,edge,88],sizes=[edge,inside,edge],
    destX=[x,x+dest,x+w-dest],destY=[y,y+dest,y+h-dest],
    widths=[dest,w-2*dest,dest],heights=[dest,h-2*dest,dest];
  for(let j=0;j<3;j++)for(let i=0;i<3;i++)
    g.drawImage(materials||floors,base[0]+sources[i],base[1]+sources[j],sizes[i],sizes[j],destX[i],destY[j],widths[i],heights[j]);
  g.save();g.globalAlpha=.28;g.fillStyle={bedroom:'#6f819e',music:'#925b63',library:'#7f6a51',study:'#5c8172',dining:'#b08b69'}[kind]||'#a4aca0';g.fillRect(x+5,y+5,w-10,h-10);g.restore();
  return true;
}

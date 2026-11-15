import {drawRpgFurniture} from './sprite-furniture.js';
import {drawMansionProp} from './mansion-props.js';
import {drawGbaFurniture} from './gba-furniture.js';
// Original pixel furniture. Only integer, opaque pixels: no curves, blur or shadows.
const INK='#27394b',WHITE='#fff9e5',WOOD='#d99e61',GOLD='#f3c451';
export function drawFurniture(g,o){
 if(drawGbaFurniture(g,o))return true;
 if(drawMansionProp(g,o))return true;
 if(drawRpgFurniture(g,o))return true;
 const X=o.x*16+(o.mounted?8:0),Y=o.y*16,w=o.w*16,h=o.h*16,cx=Math.round(w/2),cy=Math.round(h/2);
 const r=(x,y,a,b,color)=>{g.fillStyle=color;g.fillRect(X+Math.round(x),Y+Math.round(y),Math.round(a),Math.round(b));};
 const frame=(x,y,a,b,color,border=1)=>{r(x,y,a,b,INK);r(x+border,y+border,a-border*2,b-border*2,color);};
 const oval=(x,y,rx,ry,color)=>{for(let j=-ry;j<=ry;j++){const a=Math.floor(rx*Math.sqrt(Math.max(0,1-j*j/(ry*ry))));r(x-a,y+j,a*2+1,1,color);}};
 const disc=(x,y,rx,ry,color)=>{oval(x,y,rx,ry,INK);oval(x,y,rx-1,ry-1,color);};
 switch(o.type){
 case 'piano':
  frame(0,0,w,h,'#414b68',2);r(4,3,w-8,h-18,'#636d8b');r(5,4,w-10,1,'#aab9ce');
  frame(4,h-13,w-8,11,WHITE);for(let x=10;x<w-6;x+=6){r(x,h-12,1,9,'#8b9aa6');if((x/6|0)%7!==2)r(x-1,h-12,3,5,INK);}r(cx-5,5,10,2,GOLD);return true;
 case 'bed':
  frame(0,0,w,h,'#8d657e',2);frame(3,3,w-6,h-6,WHITE);for(const x of [7,cx+3]){frame(x,8,cx-10,17,'#ffffff');r(x+2,10,cx-14,2,'#d9e6ec');}
  frame(4,30,w-8,h-35,'#389799');r(6,32,w-12,7,'#80d2bd');r(7,h-12,w-14,3,GOLD);r(7,41,2,h-56,'#b7e6ce');r(w-9,41,2,h-56,'#b7e6ce');return true;
 case 'sofa':
  frame(0,0,w,h,'#a94f78',2);r(4,3,w-8,5,'#e5a2b7');for(let x=6;x<w-12;x+=20){const a=Math.min(18,w-x-6);frame(x,10,a,h-15,'#db8099');r(x+2,12,a-4,2,'#f4bfd0');}frame(0,7,5,h-10,'#a94f78');frame(w-5,7,5,h-10,'#a94f78');return true;
 case 'books':
  r(0,0,w,h,'#806345');r(1,1,w-2,h-2,'#b48c5e');r(1,1,w-2,1,'#dfbc87');
  for(let x=3;x<w-5;x+=6){const hh=(x/6|0)%3===0?8:10,c=['#b65c56','#518c72','#c79d4e','#5f8e9e','#a37c92'][(x/6|0)%5];r(x,h-hh-2,4,hh,c);r(x,h-hh,4,1,'#e3cfa4');r(x+4,h-hh-2,1,hh,'#826648');}r(1,h-2,w-2,1,'#e0b57c');return true;
 case 'wardrobe':
  frame(0,0,w,h,'#5f9bc2',2);for(const x of [3,cx+1]){const a=cx-4;frame(x,4,a,h-7,'#85bcda');if(a>5){r(x+2,6,a-4,1,'#d7eff2');r(x+2,9,a-4,h-15,'#4e87b4');}}
  r(cx-4,cy,2,4,GOLD);r(cx+2,cy,2,4,GOLD);r(1,h-3,w-2,2,INK);return true;
 case 'cabinet':
  frame(0,0,w,h,WOOD,2);r(3,3,w-6,2,'#f6d18b');r(2,cy,w-4,1,INK);for(let x=8;x<w-4;x+=16){r(x-2,cy-4,5,2,INK);r(x-1,cy-4,3,1,GOLD);}
  if(o.id==='kitchenpots')for(let x=12;x<w-5;x+=20){disc(x,cy+1,7,9,'#ce6a48');frame(x-4,cy-10,9,4,'#e69962');r(x-2,cy-5,2,6,'#ffd59b');}return true;
 case 'desk':case 'table':
  if(o.id==='sweets'){
   // Four tucked-in wooden chairs stay inside the existing solid dining footprint.
   for(const x of [24,w-38])for(const y of [0,h-12]){
    frame(x,y,14,12,'#a46c42');r(x+2,y+3,10,6,'#c47c65');
    r(x+1,y+(y===0?0:9),12,3,INK);r(x+2,y+(y===0?1:10),10,1,'#edc185');
   }
   r(15,h-14,4,5,INK);r(w-19,h-14,4,5,INK);
   frame(12,10,w-24,h-20,'#d4a06a',2);r(15,13,w-30,2,'#f3ce96');
   r(15,23,w-30,1,'#b68150');r(15,h-14,w-30,2,'#ae7848');
   return true;
  }
  frame(0,0,w,h,WOOD,2);r(3,3,w-6,2,'#f8d29a');r(3,h-5,w-6,2,'#9b673e');
  frame(8,6,Math.min(38,w-20),h-14,WHITE);r(26,7,1,h-16,'#6f8d9b');for(let j=10;j<h-10;j+=4){r(11,j,11,1,'#5d788d');if(w>40)r(29,j,12,1,'#5d788d');}if(w>58){disc(w-13,11,5,5,'#7ac1c4');r(w-15,9,4,3,'#41899d');}return true;
 case 'stove':
  frame(0,0,w,h,'#edf1e2',2);for(let x=14;x<w-8;x+=26){disc(x,12,8,8,'#4e6374');disc(x,12,5,5,'#a4b4bf');r(x-2,10,5,4,'#405565');r(x-1,h-7,3,3,'#da6a58');}r(4,h-4,w-8,1,'#8b9ca5');return true;
 case 'sink':
  frame(0,0,w,h,WHITE,2);frame(5,12,w-10,h-18,'#378da7',2);r(8,16,w-16,h-26,'#8bd6df');r(cx-1,3,3,14,INK);r(cx,3,7,3,'#7e9eac');r(cx+5,5,2,5,'#7e9eac');r(cx,3,5,1,WHITE);return true;
 case 'terminal':
  frame(0,0,w,h,'#79a5b0',2);frame(cx-18,-7,36,26,INK,2);frame(cx-15,-4,30,20,'#7fdfd2');for(let x=cx-11;x<cx+12;x+=8)for(let y=0;y<12;y+=6)r(x,y,5,3,'#2e7e8b');frame(cx-18,22,36,7,'#d5e7dd');for(let x=cx-14;x<cx+15;x+=5)r(x,24,3,2,'#567788');return true;
 case 'drums':
  for(let x=8;x<w;x+=16){frame(x-6,5,13,10,'#c78145');disc(x,5,7,4,WHITE);disc(x,5,3,2,'#334c61');r(x-4,10,1,4,WHITE);r(x+4,10,1,4,WHITE);}return true;
 case 'tea':
  disc(cx,cy+2,Math.min(9,cx-1),Math.min(9,cy-1),GOLD);frame(cx-4,2,9,4,'#ffd985');r(cx+7,cy-1,5,3,INK);r(cx+9,cy-4,3,4,GOLD);r(cx-3,cy-3,2,7,'#fff0b7');if(h>18)disc(5,h-5,4,3,WHITE);return true;
 case 'spices':
  frame(0,h-4,w,4,'#b47e4e');for(let x=4;x<w-8;x+=13){frame(x,4,10,h-8,['#df7256','#6d9b62','#d4a231'][(x/13|0)%3]);frame(x,1,10,4,GOLD);r(x+3,7,4,3,WHITE);}return true;
 case 'sacks':
  for(let x=8;x<w;x+=15){disc(x,9,6,6,'#e8cc8b');r(x-3,2,7,2,INK);r(x-2,8,5,2,'#9f783b');}return true;
 case 'plant':
  frame(4,h-11,9,10,'#c36e48');frame(2,h-13,13,4,'#e8a36c');r(7,4,2,h-17,'#34735d');disc(5,10,4,6,'#47815c');disc(10,6,4,5,'#71aa6b');r(9,3,2,3,'#c8dca1');return true;
 case 'mirror':
  frame(0,-20,w,h+20,GOLD,2);for(let x=4;x<w-10;x+=16){frame(x,-16,12,h+12,'#77b9d1');r(x+2,-13,2,h+5,'#f1fcf1');r(x+6,-11,2,h,'#c2eced');}r(1,h-3,w-2,2,INK);return true;
 case 'clock':
  frame(1,-6,w-2,h+6,'#b98346',2);disc(cx,7,6,7,WHITE);r(cx-1,1,2,1,INK);r(cx-1,12,2,1,INK);r(cx-5,7,1,1,INK);r(cx+5,7,1,1,INK);r(cx-1,17,2,7,INK);disc(cx,25,3,3,GOLD);return true;
 case 'fuse':
  frame(1,0,14,h,'#e5a24d',2);r(4,5,8,2,WHITE);r(8,10,3,5,INK);r(5,14,5,3,INK);r(5,17,3,6,INK);r(5,25,2,3,'#4f8f6a');return true;
 default:return false;
 }
}

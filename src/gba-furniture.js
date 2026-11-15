// Original raised-surface furniture: 16px tiles, hand-placed three-tone materials.
// Surface/front/side shading is baked into the sprite, not a lighting effect.
export function drawGbaFurniture(g,o){
 const X=o.x*16+(o.mounted?8:0),Y=o.y*16,w=o.w*16,h=o.h*16,cx=Math.floor(w/2);
 const edge='#515d60',wood='#c49b51',top='#e6ca7e',light='#fff0ac',front='#aa7d40',dark='#805d35',cream='#f4efca';
 const r=(x,y,a,b,c)=>{g.fillStyle=c;g.fillRect(X+Math.round(x),Y+Math.round(y),Math.round(a),Math.round(b));};
 const box=(x,y,a,b,c)=>{r(x,y,a,b,edge);r(x+1,y+1,a-2,b-2,c);};
 const panel=(x,y,a,b,c)=>{box(x,y,a,b,c);r(x+1,y+1,a-2,1,light);r(x+1,y+2,1,b-3,top);r(x+a-2,y+2,1,b-3,front);};
 const chair=(x,y,facing='up')=>{
  // Backrest, padded seat, exposed apron and two separate legs.
  if(facing==='down'){box(x+2,y+1,12,6,'#a9c394');r(x+3,y+2,10,2,'#dae5ae');box(x+1,y+6,14,7,'#829d78');r(x+3,y+7,10,3,'#b9cd97');r(x+2,y+12,2,4,edge);r(x+12,y+12,2,4,edge);}
  else{r(x+2,y+10,2,5,edge);r(x+12,y+10,2,5,edge);box(x+1,y+7,14,6,'#8ca27c');r(x+3,y+8,10,2,'#bccd9a');box(x+2,y,12,10,'#7e9b79');r(x+3,y+1,10,2,'#d1dda7');r(x+3,y+3,10,4,'#a4bd8c');}
 };
 const table=(x,y,a,b)=>{
  // Inset corners and a visible six-pixel apron give a shallow octagonal top.
  r(x+3,y+b-3,4,7,dark);r(x+a-7,y+b-3,4,7,dark);
  r(x+3,y,a-6,b,edge);r(x,y+3,a,b-6,edge);r(x+3,y+b-7,a-6,7,front);
  r(x+3,y+1,a-6,b-9,top);r(x+1,y+3,a-2,b-11,top);r(x+4,y+2,a-8,1,light);r(x+2,y+4,1,b-13,light);
  r(x+3,y+b-9,a-6,2,wood);r(x+4,y+b-7,a-8,1,'#d9ad60');r(x+4,y+b-2,a-8,1,dark);
  for(let xx=12;xx<a-7;xx+=16)r(x+xx,y+5,1,Math.max(1,b-18),'#dbba6d');
 };
 const book=(x,y)=>{box(x,y,24,12,'#d3c78f');r(x+1,y+1,10,8,cream);r(x+13,y+1,10,8,'#e1dfb3');r(x+12,y+1,1,9,'#a89969');for(let j=3;j<8;j+=2){r(x+3,y+j,6,1,'#a5ae93');r(x+15,y+j,6,1,'#a5ae93');}};
 const cabinet=(x,y,a,b)=>{
  box(x,y,a,b,wood);r(x+1,y+1,a-2,5,'#d7d6a6');r(x+2,y+1,a-4,1,'#f5efc0');r(x+1,y+6,a-2,2,'#8d9a88');
  for(let xx=2;xx<a-3;xx+=16){const ww=Math.min(14,a-xx-2);panel(x+xx,y+9,ww,b-12,'#cba35d');r(x+xx+ww-5,y+12,3,1,dark);}
  r(x+2,y+b-3,a-4,2,dark);
 };
 switch(o.type){
 case 'table':case 'desk':
  if(o.id==='sweets'){
   for(const x of [12,w-28])chair(x,0);
   table(3,8,w-6,h-14);
   for(const x of [12,w-28])chair(x,h-16,'down');
  }else{table(0,0,w,h-4);book(9,5);box(w-21,7,11,8,'#b4c8b3');r(w-20,8,9,2,'#e0e7c4');r(w-10,8,3,5,wood);}
  return true;
 case 'bed':
  // Tall headboard, two white pillows, folded cover, mattress edge and footboard.
  box(0,0,w,h-1,'#9c834f');r(2,1,w-4,4,'#dec784');r(3,2,w-6,1,light);r(2,6,w-4,8,'#bda369');
  box(3,13,w-6,h-20,'#e7e8c7');r(4,14,w-8,3,'#fff8da');
  for(const x of [6,cx+2]){const a=cx-8;box(x,17,a,12,'#d3ddc3');r(x+1,18,a-2,7,'#fffce2');r(x+2,18,a-4,1,'#ffffff');r(x+2,26,a-3,1,'#a9bba8');}
  r(4,30,w-8,h-41,'#559d9b');r(5,31,w-10,h-44,'#73b8a8');r(5,30,w-10,5,'#b3d7b9');r(5,35,w-10,1,'#438981');
  r(5,h-15,w-10,4,'#d3dfb6');r(4,h-11,w-8,3,'#a7bfa8');r(2,h-8,w-4,6,wood);r(3,h-8,w-6,2,top);r(2,h-3,4,3,dark);r(w-6,h-3,4,3,dark);
  for(let x=11;x<w-8;x+=12)for(let y=42;y<h-18;y+=12){r(x,y,3,1,'#e2de9b');r(x+1,y-1,1,3,'#f4eab2');}return true;
 case 'piano':
  box(0,0,w,h-2,'#65757a');r(2,1,w-4,12,'#8b9997');r(3,2,w-6,2,'#b7c4b7');r(3,6,w-6,5,'#7b8b8b');
  box(3,14,w-6,12,'#e7e7cc');r(4,15,w-8,6,'#fff4cf');
  for(let x=7,i=0;x<w-6;x+=5,i++){r(x,16,1,8,'#a7b5a9');if(i%7!==2&&i%7!==6)r(x,15,3,5,'#455660');}
  r(3,26,w-6,3,'#53646c');r(5,29,4,3,edge);r(w-9,29,4,3,edge);r(cx-7,9,14,1,'#dcc879');return true;
 case 'sofa':{
  const green=o.id==='divan'||o.id==='studysofa'||o.id==='librarychair',c=green?['#91b99b','#bbd5aa','#638e85']:['#88acc0','#bdd1cf','#5d8195'];
  box(0,0,w,h-2,'#9ca78d');r(2,1,w-4,7,c[0]);r(3,2,w-6,2,c[1]);r(3,8,w-6,2,c[2]);
  for(let x=6;x<w-6;x+=18){const a=Math.min(16,w-6-x);if(a<4)break;box(x,11,a,h-18,c[0]);r(x+1,12,a-2,3,c[1]);}
  for(const x of [1,w-6]){box(x,7,5,h-10,c[2]);r(x+1,8,3,4,c[1]);}
  r(6,h-7,w-12,4,c[2]);r(7,h-7,w-14,1,c[0]);r(3,h-3,3,3,edge);r(w-6,h-3,3,3,edge);return true;}
 case 'wardrobe':
  box(0,0,w,h,'#9c854f');r(1,1,w-2,6,'#d2bd79');r(2,1,w-4,1,'#f2dca1');r(1,7,w-2,2,'#7b754f');
  {const n=w>=32?2:1,a=Math.floor((w-4)/n);for(let i=0;i<n;i++){const x=2+i*a;panel(x,9,a-1,h-13,'#c1a165');if(a>9){r(x+3,12,a-7,5,'#d7bc7b');r(x+3,18,a-7,1,'#a2874d');}}}
  r(cx-3,16,7,9,'#927542');r(cx-2,17,5,7,'#e2ca7d');r(cx-1,18,3,3,edge);r(cx,20,1,3,edge);r(2,h-3,w-4,2,'#786e4c');return true;
 case 'books':
  box(0,0,w,h,'#8e804f');r(1,1,w-2,3,'#ceb773');r(2,1,w-4,1,'#efe0a2');r(2,5,w-4,h-8,'#776849');
  for(let x=4,i=0;x<w-5;x+=5,i++){const hh=i%3?7:6,c=['#65949a','#ae8867','#8d9b67','#bdaf74','#7b83a0'][i%5];r(x,h-hh-2,3,hh,c);r(x,h-hh-1,3,1,'#dfd7a4');r(x+3,h-hh-2,1,hh,'#625d49');}
  r(1,h-3,w-2,2,'#c2a064');r(2,h-3,w-4,1,'#edcf8b');return true;
 case 'cabinet':
  if(o.id==='kitchenpots')return false;
  cabinet(0,0,w,h);return true;
 case 'stove':
  cabinet(0,0,w,h);{const x=Math.floor(w/2)-24;box(x,1,48,21,'#b4c3ba');r(x+1,2,46,2,'#edf0ce');
  for(const xx of [x+10,x+34])for(const yy of [8,16]){box(xx-5,yy-3,11,6,'#5c7076');r(xx-3,yy-2,7,3,'#82958e');r(xx-1,yy-1,3,1,'#405967');}
  r(x+5,24,38,3,'#5c7076');for(const xx of [x+7,x+18,x+29,x+40])r(xx,24,2,2,'#dde3bb');}return true;
 case 'sink':
  cabinet(0,0,w,h);box(3,7,w-6,19,'#798f96');r(5,9,w-10,14,'#abbfb7');r(6,10,w-12,2,'#d6dcc0');r(5,23,w-10,2,'#617d87');
  r(cx-1,2,3,12,edge);r(cx,2,7,2,'#d7e3d2');r(cx+5,4,2,4,'#a1b6b3');r(cx,3,1,9,'#dce7d6');return true;
 case 'mirror':
  for(let x=0;x<w;x+=16){box(x,-18,16,34,'#9b9978');r(x+2,-17,12,2,'#e5d79d');box(x+2,-14,12,26,'#7fa3b1');r(x+3,-13,10,23,'#b1ccd0');
   for(let y=0;y<18;y++){const xx=x+3+(y%10);r(xx,-11+y,Math.min(2,x+13-xx),1,'#e9efd9');}r(x+1,13,14,2,'#c4ba87');}return true;
 case 'terminal':
  table(0,0,w,h-4);box(cx-16,-6,32,23,'#6c818a');r(cx-14,-5,28,3,'#c3d0c1');box(cx-13,-1,26,14,'#547f8b');r(cx-11,1,22,10,'#89b4b0');
  for(let i=0;i<3;i++)for(let j=0;j<2;j++)r(cx-9+i*7,3+j*4,4,2,'#c1d9bb');r(cx-3,17,6,3,'#617985');panel(cx-17,21,34,6,'#d4d6b4');for(let i=0;i<7;i++)r(cx-13+i*4,23,2,1,'#83948d');return true;
 default:return false;
 }
}

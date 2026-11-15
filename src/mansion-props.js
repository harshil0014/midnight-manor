// Original GBA-scale mansion fixtures. Solid integer pixels, no simulated lighting.
export function drawMansionProp(g,o){
 const X=o.x*16+(o.mounted?8:0),Y=o.y*16,w=o.w*16,h=o.h*16,cx=w/2;
 const ink='#534638',brass='#c38a36',gold='#efbf62',cream='#fff0bf',wood='#a4764d';
 const r=(x,y,a,b,c)=>{g.fillStyle=c;g.fillRect(X+Math.round(x),Y+Math.round(y),Math.round(a),Math.round(b));};
 const box=(x,y,a,b,c)=>{r(x,y,a,b,ink);r(x+1,y+1,a-2,b-2,c);};
 const lines=(x,y,widths,c)=>widths.forEach((a,i)=>r(x-Math.floor(a/2),y+i,a,1,c));
 const pot=(x,y,c)=>{lines(x,y,[6,8,10,10,8,8,6],ink);lines(x,y+1,[6,8,8,6,6],c);r(x-4,y-2,8,3,gold);r(x-2,y+1,1,3,cream);};
 switch(o.type){
 case 'cabinet':
  if(o.id!=='kitchenpots')return false;
  box(0,0,w,h,wood);r(2,2,w-4,2,'#e0b57c');r(2,13,w-4,2,ink);r(2,h-4,w-4,2,'#d9b17e');
  for(let x=10;x<w-5;x+=20){pot(x,5,'#c77e55');box(x-6,18,13,9,'#c89665');r(x-1,21,2,2,gold);}return true;
 case 'bell':
  // An actual hanging temple bell: carved frame, chain, domed shoulder, flared lip.
  r(1,-13,3,28,ink);r(w-4,-13,3,28,ink);r(2,-12,1,26,wood);r(w-3,-12,1,26,wood);
  box(0,-16,w,5,wood);r(2,-15,w-4,1,'#dfb978');r(cx-1,-11,2,5,brass);r(cx,-10,1,1,cream);
  lines(cx,-7,[6,10,12,12,14,14,16,16,18,18,20,22,24],ink);
  lines(cx,-6,[4,8,10,10,12,12,14,14,16,16,18],gold);
  r(cx-4,-3,2,7,cream);r(cx+5,0,2,5,brass);r(cx-10,5,20,2,brass);r(cx-11,6,22,1,cream);
  r(cx-1,7,2,5,ink);r(cx-2,10,4,3,brass);r(cx-1,10,2,1,gold);
  r(0,14,6,2,ink);r(w-6,14,6,2,ink);return true;
 case 'clock':
  // Face stays centred at (8,7), matching the authoritative animated hands.
  box(-1,-9,18,h+9,wood);r(1,-11,14,3,ink);r(2,-10,12,2,gold);r(2,-6,12,1,'#dfb978');
  lines(8,-3,[8,12,14,16,16,16,16,16,16,16,16,16,16,14,12,8],ink);
  lines(8,-2,[8,12,12,14,14,14,14,14,14,14,14,12,12,8],cream);
  r(7,-1,2,2,ink);r(7,13,2,1,ink);r(1,6,2,2,ink);r(13,6,2,2,ink);
  for(const [x,y] of [[3,2],[11,2],[3,11],[11,11]])r(x,y,1,1,brass);
  box(3,16,10,h-20,'#634d3c');r(7,17,2,7,brass);lines(8,22,[4,6,6,6,4],gold);r(6,23,2,2,cream);
  r(-2,h-3,20,3,ink);r(-1,h-3,18,1,gold);return true;
 case 'fuse':
  box(0,0,w,h,'#899b91');r(2,2,w-4,2,'#d4ded0');box(3,6,w-6,10,'#344b4d');
  r(5,8,2,5,'#dfba63');r(9,8,2,5,'#d47552');r(4,19,8,7,ink);r(5,20,6,2,'#d9daca');r(9,23,2,3,'#b95e48');
  for(const y of [3,h-4])for(const x of [2,w-3])r(x,y,1,1,ink);r(3,h-3,7,1,'#536c65');return true;
 case 'vent':
  box(0,2,w,h-3,'#b2b7a9');box(2,4,w-4,h-7,'#354b4a');
  for(let x=4;x<w-3;x+=3)r(x,5,1,h-9,'#8c9f94');for(const x of [1,w-2])for(const y of [3,h-3])r(x,y,1,1,cream);return true;
 case 'lanterns':
  r(0,1,w,1,ink);
  for(let x=8,i=0;x<w;x+=16,i++){
   const c=i%2?'#cf765a':'#d9a346';r(x,2,1,5,ink);box(x-5,7,11,16,c);r(x-6,9,13,2,ink);r(x-6,19,13,2,ink);
   r(x-3,11,2,8,'#f5c47d');r(x+1,11,1,8,'#fbe3a0');r(x-4,8,9,1,gold);r(x-4,22,9,1,gold);r(x,24,1,5,'#a65e4b');r(x-1,28,3,2,gold);
  }return true;
 case 'tea':{
  const cy=h>=32?15:7;
  // Brass samovar with a lid, side handles, tap and separate porcelain cups.
  box(cx-8,cy-5,16,13,brass);r(cx-6,cy-4,12,10,gold);r(cx-4,cy-3,2,7,cream);
  r(cx-6,cy-8,12,3,ink);r(cx-5,cy-7,10,1,gold);r(cx-1,cy-11,3,3,brass);
  r(cx-11,cy-3,3,7,ink);r(cx+8,cy-3,3,7,ink);r(cx+8,cy+4,5,2,gold);r(cx+11,cy+5,2,3,brass);
  r(cx-5,cy+8,10,3,ink);r(cx-4,cy+8,8,1,gold);
  if(h>=32){r(1,h-5,9,3,'#d1be99');box(3,h-10,5,5,'#f7ead3');r(8,h-9,2,3,brass);r(4,h-9,3,1,'#8b6249');}return true;}
 case 'drums':
  for(let i=0;i<2;i++){const x=8+i*16,y=i?6:3;box(x-6,y+3,13,h-y-3,'#ad7848');r(x-4,y+7,9,4,'#d4a571');for(const dx of [-4,0,4])r(x+dx,y+6,1,h-y-8,cream);lines(x,y,[9,13,15,15,13,9],ink);lines(x,y+1,[9,13,13,9],'#f4e6c2');r(x-2,y+2,5,2,'#3b4851');}return true;
 case 'spices':
  box(0,h-4,w,4,wood);
  for(let x=6,i=0;x<w-4;x+=13,i++){
   const garden=o.id==='seedpots',c=garden?'#be7953':['#c47845','#80965e','#d7a74d','#ad6855'][i%4];
   box(x-4,3,9,9,c);r(x-3,1,7,3,garden?gold:ink);r(x-2,5,5,4,cream);r(x,6,1,2,c);
   if(garden){r(x,0,1,5,'#466c47');r(x-3,0,3,2,'#7d9a56');}
  }return true;
 case 'sacks':
  for(let x=8;x<w;x+=16){lines(x,3,[8,10,12,12,12,12,12,10,8],ink);lines(x,4,[8,10,10,10,10,10,8],'#d7be86');r(x-3,1,6,2,'#9e7b4d');r(x-2,3,5,1,cream);r(x-2,7,4,3,'#aa8b58');}return true;
 case 'plant':{
  const garden=o.id.startsWith('garden'),urn=o.id.startsWith('stairurn');
  if(urn){pot(8,h-11,gold);r(6,h-15,4,4,brass);}else{box(3,h-10,10,9,'#b97e56');r(2,h-12,12,3,'#e2b17c');r(5,h-8,1,5,'#eac297');r(4,h-4,8,1,'#946345');}
  r(7,4,2,h-16,'#577946');for(let j=0;j<4;j++){const y=2+j*4,x=j%2?4:10;lines(x,y,[4,6,8,6,4],garden?'#65864c':'#4c7349');r(x-2,y+1,4,1,'#92ad67');r(x-1,y+2,3,1,'#789954');}
  if(urn||o.id==='courtflowers'||o.id==='diningplant'){for(const [x,y] of [[3,4],[10,2],[6,8]]){r(x,y,3,3,urn?cream:gold);r(x+1,y+1,1,1,urn?'#e5c68e':'#cc7543');}}return true;}
 case 'painting':case 'stairPortrait':{
  const portrait=o.type==='stairPortrait',top=portrait?-8:0,hh=portrait?26:h;
  box(0,top,w,hh,wood);box(2,top+2,w-4,hh-4,gold);r(4,top+4,w-8,hh-8,'#495d65');
  const matriarch=o.portrait==='matriarch'||o.id==='galleryportrait',headY=top+5;
  r(cx-4,headY,8,7,matriarch?'#453941':'#c9bd9e');r(cx-3,headY+2,6,6,'#c49370');r(cx-2,headY+4,1,1,ink);r(cx+1,headY+4,1,1,ink);
  r(cx-5,headY+9,10,Math.max(2,hh-17),matriarch?'#ad795b':'#617e8a');r(cx+1,headY+9,2,Math.max(2,hh-17),gold);r(cx,headY+3,1,1,matriarch?'#a84f47':'#c49370');return true;}
 case 'fountain':{
  const pool=(inset,c)=>{r(8+inset,inset,w-16-inset*2,h-inset*2,c);r(3+inset,4+inset,w-6-inset*2,h-8-inset*2,c);r(inset,9+inset,w-inset*2,h-18-inset*2,c);};
  pool(0,'#6e827e');pool(2,'#e4cc93');pool(4,'#aebca6');pool(6,'#70aab1');
  if(o.id==='gardenpool'){for(const x of [cx-16,cx+13]){lines(x,h/2-4,[6,10,12,10,6],'#538369');r(x-2,h/2-5,4,4,'#e6adc0');r(x,h/2-7,2,3,'#f8d0c9');}}
  else{const y=h/2;lines(cx,y-9,[2,4,4,6,6,8,10,12,16,18,16,12,6],'#be7993');r(cx-2,y-5,4,8,'#ebb1be');r(cx-6,y,12,3,'#f4c5c6');r(cx,y-7,1,5,cream);}
  r(9,h-10,7,1,'#bdd7cc');r(w-17,10,6,1,'#bdd7cc');return true;}
 default:return false;
 }
}

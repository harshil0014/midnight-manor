// Kenney Roguelike Indoor pack (CC0), modular 16px artwork, plus original overlays.
// The upstream PNG and unmodified license are in public/assets/kenney/.
let atlas=null;
export function setFurnitureAtlas(image){atlas=image;}
export function drawRpgFurniture(g,o){
 if(!atlas)return false;
 const X=o.x*16+(o.mounted?8:0),Y=o.y*16,w=o.w*16,h=o.h*16;
 g.imageSmoothingEnabled=false;
 const pixel=(x,y,a,b,c)=>{g.fillStyle=c;g.fillRect(X+Math.round(x),Y+Math.round(y),Math.round(a),Math.round(b));};
 const tile=(col,row,x,y,scale=1)=>g.drawImage(atlas,col*17,row*17,16,16,X+x,Y+y,16*scale,16*scale);
 const crop=(col,row,sx,sy,sw,sh,x,y,dw,dh)=>g.drawImage(atlas,col*17+sx,row*17+sy,sw,sh,X+x,Y+y,dw,dh);
 const table=(x,y,a,b)=>{for(let yy=0;yy<b;yy+=16)for(let xx=0;xx<a;xx+=16){const c=xx===0?0:xx+16>=a?2:1,r=yy+16>=b?1:0;tile(c,r,x+xx,y+yy);}};

 switch(o.type){
 case 'table':case 'desk':
  if(o.id==='sweets'){
   // Real direction-specific 16px chair sprites: backs, seats, rails and legs.
   for(const x of [8,w-24])tile(0,6,x,0);
   table(0,8,w,32);
   for(const x of [8,w-24])tile(1,6,x,h-16);
  }else{
   table(0,0,w,h);pixel(13,6,26,15,'#8e7155');pixel(14,6,24,13,'#f4ead0');pixel(25,7,1,11,'#b9a483');
   for(let j=8;j<17;j+=3){pixel(16,j,7,1,'#8c8b7c');pixel(28,j,7,1,'#8c8b7c');}tile(22,5,w-20,3);
  }return true;
 case 'piano':
  tile(23,8,0,0,2);tile(24,8,w-32,0,2);for(let x=32;x<w-32;x+=16)crop(24,8,3,0,8,16,x,0,16,32);return true;
 case 'sofa':
  if(w<=32){tile(0,6,0,0,2);pixel(7,7,18,5,'#668c7c');pixel(8,17,16,7,'#759d89');pixel(9,18,14,1,'#adc7a3');return true;}
  {const row=o.id==='divan'?15:11;tile(23,row,0,0,2);tile(24,row,w-32,0,2);for(let x=32;x<w-32;x+=12){const a=Math.min(12,w-32-x);crop(23,row,4,0,a/2,16,x,0,a,32);}for(let x=22;x<w-16;x+=22)pixel(x,11,1,12,row===15?'#368552':'#ab5b2b');pixel(7,10,6,8,'#e6d4aa');pixel(w-13,10,6,8,'#e6d4aa');}return true;
 case 'books':return false;
 case 'cabinet':
  for(let x=0;x<w;x+=16)for(let y=0;y<h;y+=16)tile(o.id==='kitchenpots'?1:x===0?0:x+16>=w?2:1,y===0?13:14,x,y);
  if(o.id==='kitchenpots')for(let x=8;x<w-5;x+=20){tile(22,5,x-5,2);pixel(x-1,8,1,3,'#f0c98a');}return true;
 case 'wardrobe':
  pixel(0,0,w,h,'#7c6246');pixel(1,1,w-2,h-3,'#b88e60');pixel(1,1,w-2,2,'#dfbd8b');
  {const n=w>=32?2:1,a=(w-4)/n;for(let i=0;i<n;i++){const x=2+i*a;pixel(x,5,a-1,h-10,'#8c6b48');pixel(x+1,6,a-3,h-13,'#c29a6c');pixel(x+2,7,a-5,1,'#e1bf8d');pixel(x+2,12,a-5,1,'#ad8255');pixel(x+a-5,16,2,4,'#edcd85');}}
  pixel(1,h-4,w-2,2,'#8e6d48');
  // Brass escutcheon with an unmistakable dark keyhole, separate from handles.
  {const x=Math.floor(w/2)-3,y=Math.floor(h/2)-1;pixel(x,y,7,9,'#7b603d');pixel(x+1,y+1,5,7,'#e4bd65');pixel(x+2,y+2,3,3,'#574738');pixel(x+3,y+4,1,3,'#574738');}return true;
 case 'stove':
  for(let x=0;x<w;x+=16){tile(9,12,x,0);tile(1,14,x,16);}
  for(let x=8;x<w-23;x+=40){tile(14,14,x,0,2);}return true;
 case 'sink':
  tile(8,12,0,0,2);for(let x=0;x<w;x+=16)tile(1,14,x,h-16);return true;
 case 'plant':
  crop(o.id.includes('garden')?16:17,0,0,0,16,12,0,0,16,24);tile(22,5,0,h-16);return true;
 case 'bed':
  // The atlas contains complete beds, not vertically stackable bed sections.
  // Keep its carved headboard and two pillows; extend one uninterrupted cover.
  pixel(0,28,w,h-28,'#368553');pixel(2,28,w-4,h-31,'#4ea96e');
  crop(12,7,0,0,16,11,0,0,w/2,40);crop(13,7,0,0,16,11,w/2,0,w/2,40);
  pixel(4,h-12,w-8,3,'#d4d6ac');pixel(1,h-6,w-2,4,'#b18a5e');pixel(2,h-6,w-4,1,'#dfba85');pixel(2,h-2,3,2,'#846347');pixel(w-5,h-2,3,2,'#846347');
  for(let x=12;x<w-8;x+=12)for(let y=46;y<h-20;y+=12){pixel(x,y,2,2,'#bdd3a1');pixel(x+1,y-1,1,4,'#d9d9b2');}return true;
 case 'mirror':
  for(let x=0;x<w;x+=16){tile(22,16,x,-16);tile(22,17,x,0);}return true;
 case 'terminal':
  table(0,0,w,h);pixel(Math.floor(w/2)-16,-7,32,23,'#5e6f72');pixel(Math.floor(w/2)-14,-5,28,17,'#9bd0bb');
  for(let i=0;i<3;i++)for(let j=0;j<2;j++)pixel(Math.floor(w/2)-11+i*8,-1+j*6,5,3,'#4d8e88');
  pixel(Math.floor(w/2)-15,21,30,6,'#aab5a5');for(let x=0;x<6;x++)pixel(Math.floor(w/2)-12+x*4,23,2,2,'#6c7b79');return true;
 default:return false;
 }
}

// Original pixel costumes, painted into every facing and walk frame of the
// existing sprite sheet. Camera feeds use the same sheets as the world.
export const outfitClasses = {
  Hulk: 'scientist', Magician: 'magician', Engineer: 'engineer', 'Escape Artist': 'thief',
};
export const classLabel = name => name === 'Hulk' ? 'Scientist' : name;
export const avatarTexture = p => p.role === 'Killer' ? 'people' :
  outfitClasses[p.class] ? `people-${outfitClasses[p.class]}` : 'people';

export function paintOutfit(g, X, Y, outfit, dir, frame) {
  const bob=frame===1?0:1,step=frame===1?0:frame===0?2:-2,
    side=dir===1||dir===2,left=dir===1,back=dir===3;
  const r=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(X+x,Y+y+bob,w,h);};
  const ink='#28303b', bodyX=side?10:6,bodyW=side?15:22;
  function clothes(main,light,dark){
    r(bodyX,21,bodyW,16,ink);r(bodyX+1,22,bodyW-2,14,main);
    r(bodyX+2,23,3,11,light);r(bodyX+bodyW-4,24,2,11,dark);
    r(side?8:4,23-step/2,4,9,main);r(side?24:27,23+step/2,3,9,dark);
    r(9,37,4,6,'#364353');r(19,37,4,6,'#364353');
  }
  if(outfit==='scientist'){
    clothes('#eef4ef','#ffffff','#abbec2');
    r(bodyX,33,bodyW,5,ink);r(bodyX+1,33,bodyW-2,4,'#e9efea');
    if(!back){
      r(side?14:14,22,5,13,'#447c8c');
      r(side?12:11,22,3,7,'#ffffff');r(side?19:20,22,3,7,'#ffffff');
      r(side?19:20,29,4,4,'#a8bfc3');r(side?20:21,28,1,4,'#437da5');
      for(let yy=29;yy<35;yy+=3)r(side?17:17,yy,1,1,'#6e8390');
      // Safety glasses follow the facial profile.
      if(side){r(left?7:19,12,5,5,ink);r(left?8:20,13,3,2,'#bee6ea');}
      else {r(8,12,7,5,ink);r(18,12,7,5,ink);r(15,13,3,1,ink);r(9,13,5,2,'#d7f1ed');r(19,13,5,2,'#d7f1ed');}
    }else{r(15,23,2,12,'#c1d1ce');r(9,31,14,1,'#aabdbb');}
  }else if(outfit==='magician'){
    clothes('#694a87','#9566ad','#49375d');
    if(!back){r(14,22,6,12,'#f2e5c4');r(12,23,3,2,'#c89157');r(20,23,3,2,'#c89157');r(16,24,2,2,ink);}
    else r(12,25,9,1,'#cba86c');
    r(8,0,17,12,ink);r(10,1,13,10,'#40364f');r(11,2,3,7,'#64516f');
    r(9,8,15,3,'#e6bd64');r(4,11,25,3,ink);r(6,11,21,1,'#79618c');
    const wx=left?2:29,wy=22+step/2;
    r(wx,wy,2,13,ink);r(wx,wy,2,4,'#fff7db');r(wx,wy+4,1,8,'#976d54');
  }else if(outfit==='engineer'){
    clothes('#e9a344','#f8c166','#b66b38');
    // Blue bib and braces over the work shirt, with a leather tool belt.
    r(side?12:10,26,side?11:14,11,'#426f9c');r(side?12:10,22,3,9,'#588bb4');r(side?21:21,22,3,9,'#588bb4');
    if(!back){r(14,28,7,4,'#315578');r(13,26,2,2,'#f0d587');r(21,26,2,2,'#f0d587');}
    r(bodyX+1,34,bodyW-2,2,'#795637');r(16,34,3,2,'#ecd28a');
    r(side?24:26,30,4,9,'#9d7448');r(side?25:27,27,2,6,'#c4d2cf');r(side?24:26,27,4,2,'#c4d2cf');
    r(8,2,17,3,ink);r(6,5,21,5,'#ecc34e');r(5,9,23,3,'#d5a33c');
    r(4,11,25,3,ink);r(5,11,23,2,'#ffe47a');r(15,3,3,7,'#fff0a0');r(9,5,3,4,'#f9da6f');
  }else if(outfit==='thief'){
    clothes('#303947','#53606e','#202936');
    if(!back){for(let yy=24;yy<33;yy+=4)r(bodyX+4,yy,bodyW-8,2,'#8d9b9c');}
    r(bodyX+1,34,bodyW-2,2,'#835359');r(16,34,3,2,'#c6b88c');
    // Knit cap plus a domino mask. No floating accessory replaces the face.
    r(8,3,17,3,ink);r(6,6,21,4,'#3b4654');r(5,9,23,3,'#252e3a');
    if(back){r(7,13,19,3,'#222b35');r(23,15,3,5,'#56616a');}
    else if(side){r(left?6:19,12,7,6,'#18232d');r(left?8:22,14,2,2,'#f0debd');r(left?17:11,13,6,2,'#18232d');}
    else{r(7,12,19,6,'#18232d');r(10,14,3,2,'#f3dfbd');r(20,14,3,2,'#f3dfbd');}
  }
}

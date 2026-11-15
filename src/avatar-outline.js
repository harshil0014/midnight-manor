// Original atlas finishing: a one-pixel ink silhouette, confined to each frame.
export function outlineAvatarAtlas(canvas){
  const g=canvas.getContext('2d'),image=g.getImageData(0,0,canvas.width,canvas.height),src=new Uint8ClampedArray(image.data),w=canvas.width;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<w;x++){
    const at=(y*w+x)*4;if(src[at+3])continue;
    const near=[[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>{const xx=x+dx,yy=y+dy;return xx>=0&&xx<w&&yy>=0&&yy<canvas.height&&Math.floor(xx/32)===Math.floor(x/32)&&Math.floor(yy/48)===Math.floor(y/48)&&src[(yy*w+xx)*4+3]>100;});
    if(near){image.data[at]=36;image.data[at+1]=49;image.data[at+2]=59;image.data[at+3]=255;}
  }
  g.putImageData(image,0,0);
}

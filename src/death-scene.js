// Original victim-only pixel vignette. No attacker identity or game coordinates.
let active=null;
export const deathAnimationActive=()=>!!active;
export function showDeathAnimation({sheet,index=0,onClose=()=>{},survival=false,hunt=false,cellScale=1}){
 active?.close();
 const overlay=document.createElement('div');overlay.className='death-scene';
 overlay.setAttribute('role','alertdialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',survival?'You were caught':'You were killed');
 overlay.innerHTML=(survival?'<div class="death-card"><span class="eyebrow">THE HUNTER FOUND YOU</span><h2>You were caught</h2><canvas width="320" height="152" aria-label="Your spirit rises after capture"></canvas><p>Your next task is to guide the household.<br>F blesses objectives and open gates. G changes floors.</p><button disabled>Continue as a spirit</button></div>':'<div class="death-card"><span class="eyebrow">THE LIGHTS HID A KILLER</span><h2>You were killed</h2><canvas width="320" height="152" aria-label="An anonymous silhouette strikes your avatar, whose spirit rises"></canvas><p>Your diya has gone out.<br>You can still roam the mansion as a ghost.</p><button disabled>Continue as ghost</button></div>');
 if(hunt){overlay.querySelector('h2').textContent='Your spirit remains';overlay.querySelector('p').innerHTML='Help the living repair the haveli.<br>Hold E at a machine. G changes areas.';}
 const previous=document.activeElement,button=overlay.querySelector('button'),canvas=overlay.querySelector('canvas'),g=canvas.getContext('2d');
 g.imageSmoothingEnabled=false;document.body.append(overlay);button.focus();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,start=performance.now();let raf,done=false;
 const close=()=>{if(done)return;done=true;cancelAnimationFrame(raf);overlay.remove();active=null;document.removeEventListener('keydown',escape,true);previous?.isConnected&&previous.focus();onClose();};
 const escape=e=>{if(e.key==='Escape'&&!button.disabled){e.preventDefault();e.stopImmediatePropagation();close();}};
 active={close};button.onclick=close;document.addEventListener('keydown',escape,true);
 function frame(now){
  if(done)return;const elapsed=now-start,t=reduced?1800:elapsed;
  const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);};
  rect(0,0,320,152,'#281c2b');
  // Jagged festive-red banner: a single sweep, no repeated flashing.
  for(let y=30;y<124;y+=4)rect((y/4%3)*9,y,320-(y/4%4)*12,4,'#843c4a');
  for(let x=0;x<320;x+=24){rect(x,28,12,2,'#c47c60');rect(x+8,124,10,2,'#c47c60');}
  const strike=t>=650,vx=192,vy=strike?101:105,ax=Math.min(130,58+t*.11);
  if(t<1450){
   // The silhouette has no name, avatar colour, jewellery or identifying detail.
   rect(ax+5,48,19,6,'#191d2a');rect(ax+2,54,25,18,'#191d2a');rect(ax,72,30,24,'#191d2a');rect(ax+3,96,8,12,'#191d2a');rect(ax+20,96,8,12,'#191d2a');
   rect(ax+(strike?26:24),strike?70:80,strike?23:9,6,'#191d2a');
  }
  if(sheet){
   g.save();g.translate(vx,vy);if(strike)g.rotate(Math.PI/2);g.globalAlpha=t>1500?.48:1;
   g.drawImage(sheet,16*cellScale,Math.max(0,Math.min(15,index))*24*cellScale,16*cellScale,24*cellScale,-16,-48,32,48);g.restore();
  }
  if(t>=650&&t<1000){for(let i=0;i<13;i++)rect(134+i*5,86-i*3,11,4,i%2?'#ffe2aa':'#f8ead0');}
  if(t>=1250){const rise=Math.min(24,(t-1250)*.025),x=203,y=74-rise;
   rect(x-7,y,14,3,'#cbded0');rect(x-10,y+3,20,15,'#dbe7d8');rect(x-8,y+18,5,3,'#dbe7d8');rect(x+3,y+18,5,3,'#dbe7d8');rect(x-4,y+7,2,4,'#567575');rect(x+3,y+7,2,4,'#567575');
  }
  // Extinguished clay diya beneath the tableau.
  if(hunt){rect(145,134,30,3,'#a9b5b2');for(let i=0;i<5;i++)rect(146+i*6,137,4,2,'#6e8284');}else{rect(146,136,27,3,'#e5bc7b');rect(150,139,19,3,'#b57859');rect(158,131,3,5,'#778784');}
  if(elapsed>=1200)button.disabled=false;
  if(elapsed>=2800){close();return;}raf=requestAnimationFrame(frame);
 }
 raf=requestAnimationFrame(frame);
}

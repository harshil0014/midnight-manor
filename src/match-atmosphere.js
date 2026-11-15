export function updateMatchAtmosphere(previous,s,title){
  const stage=document.querySelector('.hunt-stage');if(!stage)return;
  let intro=document.querySelector('#match-arrival');
  if(!intro){intro=document.createElement('aside');intro.id='match-arrival';intro.setAttribute('aria-live','polite');stage.append(intro);}
  const early=s.phase==='hunt'&&s.me.status==='active'&&s.serverNow-s.phaseAt<2800&&s.serverNow>=s.phaseAt;
  intro.hidden=!early;
  if(early){
    intro.replaceChildren();const small=document.createElement('small'),name=document.createElement('b'),hint=document.createElement('span');
    small.textContent='ROUND '+s.round+' · '+(s.speed||1)+'× SPEED';name.textContent=s.me.role==='Killer'?'YOU ARE THE HUNTER':title;
    hint.textContent=s.me.role==='Killer'?'Track. Strike. Carry. Capture.':'Repair together. Rescue friends. Reach an exit.';intro.append(small,name,hint);
  }
  let pulse=document.querySelector('#electricity-transition');
  if(!pulse){pulse=document.createElement('div');pulse.id='electricity-transition';pulse.setAttribute('aria-hidden','true');stage.append(pulse);}
  if(previous&&previous.code===s.code&&previous.round===s.round&&s.phase==='hunt'&&previous.dark!==s.dark){
    pulse.className='';void pulse.offsetWidth;pulse.className=s.dark?'power-cut':'power-back';
  }
  if(previous&&previous.code===s.code&&previous.position.floor!==s.position.floor&&(previous.position.floor===2||s.position.floor===2)){
    pulse.className='';void pulse.offsetWidth;pulse.className='door-cross';
  }
}
export function resultsSummary(s){
  if(!s.results)return '';
  const items=[[s.completed+'/'+s.required,'Machines'],[s.results.rescues||0,'Rescues'],[s.results.wiggles||0,'Wiggle escapes'],[s.results.escaped||0,'Escaped']];
  return '<div class="match-summary">'+items.map(([v,label])=>`<div><b>${v}</b><small>${label}</small></div>`).join('')+'</div>';
}

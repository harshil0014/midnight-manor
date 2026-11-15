const feedbackWords={hit:'HIT',miss:'MISSED',stun:'FLASH LANDED',stunned:'STUNNED',resisted:'FLASH RESISTED'};
let match='',lastFeedback=0;
export function rescueNeeds(s,now){
  if(s.phase!=='hunt'||s.me.role==='Killer'||s.me.status!=='active')return [];
  return (s.rescues||[]).filter(q=>q.id!==s.me.id&&['downed','captured'].includes(q.status)).sort((a,b)=>a.until-b.until).slice(0,2).map(q=>({...q,seconds:Math.max(0,Math.ceil((q.until-now)/1000)),captures:(s.players||[]).find(p=>p.id===q.id)?.captures||0}));
}
export function updateHuntDetails(s,onTrack,onSound){
  const stage=document.querySelector('.hunt-stage');if(!stage)return;
  const key=s.code+':'+s.round;if(match!==key){match=key;lastFeedback=0;}
  let feedback=document.querySelector('#hunt-confirmation');if(!feedback){feedback=document.createElement('div');feedback.id='hunt-confirmation';feedback.setAttribute('aria-live','polite');stage.append(feedback);}
  const f=s.me.feedback,word=f&&feedbackWords[f.kind];feedback.hidden=!(word&&s.phase==='hunt'&&s.serverNow-f.at<750);
  if(word){feedback.textContent=word;feedback.dataset.kind=f.kind;if(f.seq!==lastFeedback){lastFeedback=f.seq;if(s.serverNow-f.at<750)onSound(f.kind);}}
  let needs=document.querySelector('#hunt-rescue-needs');if(!needs){needs=document.createElement('aside');needs.id='hunt-rescue-needs';needs.setAttribute('aria-label','Teammates needing rescue');stage.append(needs);}
  const cards=rescueNeeds(s,s.serverNow),signature=JSON.stringify(cards.map(q=>[q.id,q.status,q.seconds,q.captures]));
  needs.hidden=!cards.length;
  if(needs.dataset.signature!==signature){
    needs.dataset.signature=signature;needs.replaceChildren();
    for(const q of cards){
      const b=document.createElement('button'),name=document.createElement('b'),detail=document.createElement('small');b.dataset.rescue=q.id;b.dataset.urgent=q.seconds<=20?'true':'false';
      name.textContent=q.name;detail.textContent=(q.status==='captured'?'CAPTURE '+q.captures+'/3':'DOWNED')+' · '+q.seconds+'s · RESCUE →';b.append(name,detail);b.onclick=()=>onTrack(q.id);needs.append(b);
    }
  }
}

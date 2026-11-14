import {rpc} from './supabase-site.js?v=e4';
async function update(){try{const s=await rpc('suzini_e4_status'),link=document.querySelector('.home-programme'),title=link?.querySelector('span');if(title?.firstChild)title.firstChild.textContent=s.open?'Inscrire mon équipe':s.initially_closed?'Inscriptions prochainement':s.registration_state==='closed'?'Inscriptions closes':'Inscriptions suspendues';}catch{}}
update();setInterval(()=>{if(!document.hidden)update();},15000);

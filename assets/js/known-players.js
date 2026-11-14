import {config} from './supabase-config.js?v=e4';
const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
export function attachKnownPlayers(form,{club=false,client=null}={}){
 const controllers=[];
 for(const n of [1,2]){
  const first=form.elements['p'+n+'FirstName'],last=form.elements['p'+n+'LastName'],licence=form.elements['p'+n+'Licence'];if(!first||!last)continue;
  if(licence){licence.required=false;licence.closest('.field').hidden=false;licence.readOnly=false;licence.pattern='[0-9]{1,7}[A-Za-z]?';}
  const box=make('span');box.className='known-player-status';box.style.cssText='white-space:nowrap;font-size:9px;margin-left:6px;font-weight:600';box.setAttribute('aria-live','polite');
  first.closest('fieldset').querySelector('legend').append(box);
  let key='',promise=Promise.resolve(),timer,version=0;
  async function lookup(){
   const next=first.value.trim()+'|'+last.value.trim();if(next===key)return promise;key=next;const id=++version;
   if(!first.value.trim()||!last.value.trim()){box.textContent='';first.setCustomValidity('');return;}
   first.setCustomValidity('Vérification du joueur en cours…');box.textContent='🐝 Recherche du joueur…';
   promise=(async()=>{try{
    const args={p_first_name:first.value.trim(),p_last_name:last.value.trim(),p_sex:n===1?'M':'F',p_club:club};
    let data;
    if(club){const r=await client.rpc('suzini_e4_registration_lookup',args);if(r.error)throw r.error;data=r.data;}else{
    const r=await fetch(config.supabaseUrl+'/rest/v1/rpc/suzini_e4_registration_lookup',{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_first_name:first.value.trim(),p_last_name:last.value.trim(),p_sex:n===1?'M':'F'}),signal:AbortSignal.timeout(12000)});
    data=await r.json();if(!r.ok)throw Error('Vérification indisponible. Réessayez.');}if(id!==version)return;
    if(licence){licence.value=licence.value||(data.licence||'').replace(/\s/g,'').toUpperCase();licence.required=!data.known;}
    box.textContent=data.known?'✓ Joueur reconnu':'';
    first.setCustomValidity('');return data.known===true;
   }catch(e){if(id===version){key='';box.textContent=e.message;first.setCustomValidity('La vérification du joueur a échoué. Modifiez le nom puis réessayez.');}}})();return promise;
  }
  for(const input of [first,last])input.addEventListener('input',()=>{clearTimeout(timer);if(licence)licence.value='';version++;key='';timer=setTimeout(lookup,450);});
  controllers.push(()=>{clearTimeout(timer);return lookup();});
 }
 return {prepare:()=>Promise.all(controllers.map(f=>f()))};
}

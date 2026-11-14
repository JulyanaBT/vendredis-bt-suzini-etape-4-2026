import {config} from './supabase-config.js?v=e4';
const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
export function attachKnownPlayers(form,{club=false,client=null}={}){
 const controllers=[];
 for(const n of [1,2]){
  const first=form.elements['p'+n+'FirstName'],last=form.elements['p'+n+'LastName'],licence=form.elements['p'+n+'Licence'];if(!first||!last)continue;
  if(licence){licence.required=false;licence.closest('.field').hidden=!club;licence.readOnly=false;licence.pattern='[0-9]{1,7}[A-Za-z]?';licence.closest('.field').style.gridColumn='1 / -1';}
  const box=make('div');box.className='known-player-status';box.style.cssText='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px;margin:2px 0';box.setAttribute('aria-live','polite');
  const extra=make('div');extra.className='whatsapp-player-fields';extra.hidden=true;
  const label=make('label','Téléphone WhatsApp'),phone=make('input');phone.type='tel';phone.name='p'+n+'Phone';phone.autocomplete='tel';phone.placeholder='+594… ou +33…';phone.pattern='[+0-9 ().-]{8,24}';label.append(phone);
  const consentLabel=make('label'),consent=make('input');consent.type='checkbox';consent.name='p'+n+'WhatsappConsent';consentLabel.append(consent,document.createTextNode(' Ce joueur accepte de communiquer son numéro à l’organisation pour rejoindre le groupe WhatsApp du tournoi.'));
  const replacement=make('button','Modifier le numéro');replacement.type='button';replacement.hidden=true;replacement.onclick=()=>{extra.hidden=false;replacement.hidden=true;phone.focus();};extra.append(label,consentLabel);first.closest('fieldset')?.append(box,replacement,extra);
  let key='',promise=Promise.resolve(),timer,version=0;
  async function lookup(){
   const next=first.value.trim()+'|'+last.value.trim();if(next===key)return promise;key=next;const id=++version;phone.value='';consent.checked=false;replacement.hidden=true;
   if(!first.value.trim()||!last.value.trim()){extra.hidden=true;phone.required=consent.required=false;box.textContent='';if(licence){licence.value='';licence.closest('.field').hidden=!club;}first.setCustomValidity('');return;}
   first.setCustomValidity('Vérification du joueur en cours…');box.textContent='🐝 Recherche du joueur…';
   promise=(async()=>{try{
    const args={p_first_name:first.value.trim(),p_last_name:last.value.trim(),p_sex:n===1?'M':'F',p_club:club};
    let data;
    if(club){const r=await client.rpc('suzini_e4_registration_lookup',args);if(r.error)throw r.error;data=r.data;}else{
    const r=await fetch(config.supabaseUrl+'/rest/v1/rpc/suzini_e4_registration_lookup',{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_first_name:first.value.trim(),p_last_name:last.value.trim(),p_sex:n===1?'M':'F'}),signal:AbortSignal.timeout(12000)});
    data=await r.json();if(!r.ok)throw Error('Vérification indisponible. Réessayez.');}if(id!==version)return;
    if(licence){licence.value=data.licence||'';licence.closest('.field').hidden=!data.known&&!club;}
    const member=data.whatsapp_member===true, optional=member||data.has_phone===true;
    extra.hidden=optional&&!club;phone.required=consent.required=!optional&&!club;
    consentLabel.hidden=optional;
    replacement.hidden=club||!optional;
    replacement.textContent=data.has_phone?'Modifier le numéro':'Ajouter un numéro';
    phone.value=club?data.phone||'':'';
    box.textContent=data.known?'✓ Joueur reconnu'+(!club&&data.has_phone?' · Numéro déjà enregistré':member?' · Déjà dans le groupe WhatsApp':''):'';
    first.setCustomValidity('');
   }catch(e){if(id===version){key='';box.textContent=e.message;first.setCustomValidity('La vérification du joueur a échoué. Modifiez le nom puis réessayez.');}}})();return promise;
  }
  for(const input of [first,last])input.addEventListener('input',()=>{clearTimeout(timer);if(licence)licence.value='';version++;key='';phone.value='';replacement.hidden=true;extra.hidden=true;timer=setTimeout(lookup,450);});
  controllers.push(()=>{clearTimeout(timer);return lookup();});
 }
 return {prepare:()=>Promise.all(controllers.map(f=>f()))};
}

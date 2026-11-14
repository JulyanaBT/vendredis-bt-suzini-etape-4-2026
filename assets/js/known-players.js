import {config} from './supabase-config.js?v=e4';
const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
export function attachKnownPlayers(form,{club=false,client=null}={}){
 const controllers=[];
 for(const n of [1,2]){
  const first=form.elements['p'+n+'FirstName'],last=form.elements['p'+n+'LastName'],licence=form.elements['p'+n+'Licence'];if(!first||!last)continue;
  if(licence){licence.required=false;licence.closest('.field').hidden=false;licence.readOnly=false;licence.pattern='[0-9]{1,7}[A-Za-z]?';}
  const box=make('div');box.className='known-player-status';box.style.cssText='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px;margin:2px 0';box.setAttribute('aria-live','polite');
  const extra=make('div');extra.className='field signup-phone';
  const label=make('label','Téléphone'),phone=make('input');phone.type='tel';phone.name='p'+n+'Phone';phone.autocomplete='tel';phone.placeholder='+594… ou +33…';phone.pattern='[+0-9 ().-]{8,24}';label.htmlFor=phone.id='signup-phone-'+n;extra.append(label,phone);
  const consentLabel=make('label');consentLabel.className='signup-wa';const consent=make('input');consent.type='checkbox';consent.name='p'+n+'WhatsappConsent';consentLabel.append(consent,document.createTextNode(' Accord pour rejoindre le groupe WhatsApp.'));
  const grid=first.closest('.player-grid');grid.append(extra,consentLabel);first.closest('fieldset').append(box);
  let key='',promise=Promise.resolve(),timer,version=0;
  async function lookup(){
   const next=first.value.trim()+'|'+last.value.trim();if(next===key)return promise;key=next;const id=++version;phone.value='';consent.checked=false;
   if(!first.value.trim()||!last.value.trim()){phone.required=consent.required=false;box.textContent='';if(licence)licence.value='';first.setCustomValidity('');return;}
   first.setCustomValidity('Vérification du joueur en cours…');box.textContent='🐝 Recherche du joueur…';
   promise=(async()=>{try{
    const args={p_first_name:first.value.trim(),p_last_name:last.value.trim(),p_sex:n===1?'M':'F',p_club:club};
    let data;
    if(club){const r=await client.rpc('suzini_e4_registration_lookup',args);if(r.error)throw r.error;data=r.data;}else{
    const r=await fetch(config.supabaseUrl+'/rest/v1/rpc/suzini_e4_registration_lookup',{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_first_name:first.value.trim(),p_last_name:last.value.trim(),p_sex:n===1?'M':'F'}),signal:AbortSignal.timeout(12000)});
    data=await r.json();if(!r.ok)throw Error('Vérification indisponible. Réessayez.');}if(id!==version)return;
    if(licence){licence.value=licence.value||data.licence||'';licence.required=!data.known;}
    const member=data.whatsapp_member===true, optional=member||data.has_phone===true;
    phone.required=consent.required=!optional&&!club;
    consentLabel.hidden=optional;
    if(club&&!phone.value)phone.value=data.phone||'';phone.placeholder=member?'Déjà dans le groupe WhatsApp':data.has_phone&&!club?'Numéro déjà enregistré':'+594… ou +33…';phone.title=phone.placeholder;
    box.textContent=data.known?'✓ Joueur reconnu':'';
    first.setCustomValidity('');
   }catch(e){if(id===version){key='';box.textContent=e.message;first.setCustomValidity('La vérification du joueur a échoué. Modifiez le nom puis réessayez.');}}})();return promise;
  }
  for(const input of [first,last])input.addEventListener('input',()=>{clearTimeout(timer);if(licence)licence.value='';version++;key='';phone.value='';phone.placeholder='+594… ou +33…';consentLabel.hidden=false;timer=setTimeout(lookup,450);});
  controllers.push(()=>{clearTimeout(timer);return lookup();});
 }
 return {prepare:()=>Promise.all(controllers.map(f=>f()))};
}

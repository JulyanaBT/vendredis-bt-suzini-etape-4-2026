import {config} from './supabase-config.js?v=e4';
const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
export function attachKnownPlayers(form,{club=false}={}){
 const controllers=[];
 for(const n of [1,2]){
  const first=form.elements['p'+n+'FirstName'],last=form.elements['p'+n+'LastName'],licence=form.elements['p'+n+'Licence'];if(!first||!last)continue;
  if(licence){licence.required=false;licence.closest('.field').hidden=!club;licence.readOnly=!club;}
  const box=make('div');box.className='known-player-status';box.setAttribute('aria-live','polite');
  const extra=make('div');extra.className='whatsapp-player-fields';extra.hidden=true;
  const label=make('label','Téléphone WhatsApp'),phone=make('input');phone.type='tel';phone.name='p'+n+'Phone';phone.autocomplete='tel';phone.placeholder='+594… ou +33…';phone.pattern='[+0-9 ().-]{8,24}';label.append(phone);
  const consentLabel=make('label'),consent=make('input');consent.type='checkbox';consent.name='p'+n+'WhatsappConsent';consentLabel.append(consent,document.createTextNode(' Ce joueur accepte de communiquer son numéro à l’organisation pour rejoindre le groupe WhatsApp du tournoi.'));
  extra.append(label,consentLabel);first.closest('fieldset')?.append(box,extra);
  let key='',promise=Promise.resolve(),timer,version=0;
  async function lookup(){
   const next=first.value.trim()+'|'+last.value.trim();if(next===key)return promise;key=next;const id=++version;
   if(!first.value.trim()||!last.value.trim()){extra.hidden=true;phone.required=consent.required=false;box.textContent='';if(licence&&!club)licence.value='';return;}
   first.setCustomValidity('Vérification du joueur en cours…');box.textContent='🐝 Recherche du joueur…';
   promise=(async()=>{try{
    const r=await fetch(config.supabaseUrl+'/rest/v1/rpc/suzini_e4_player_lookup',{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_first_name:first.value.trim(),p_last_name:last.value.trim(),p_sex:n===1?'M':'F'}),signal:AbortSignal.timeout(12000)});
    const data=await r.json();if(!r.ok)throw Error('Vérification indisponible. Réessayez.');if(id!==version)return;
    if(licence){licence.value=data.licence||'';licence.closest('.field').hidden=!data.licence&&!club;}
    const member=data.whatsapp_member===true;extra.hidden=member;phone.required=consent.required=!member&&!club;
    box.textContent=(data.known?'✓ Joueur reconnu'+(data.licence?' · licence préremplie':' · licence à vérifier par le JA'):'Nouveau joueur · licence à vérifier par le JA')+(member?' · déjà dans le groupe WhatsApp.':' · 🌶️ rejoignez le groupe après inscription.');first.setCustomValidity('');
   }catch(e){if(id===version){key='';box.textContent=e.message;first.setCustomValidity('La vérification du joueur a échoué. Modifiez le nom puis réessayez.');}}})();return promise;
  }
  for(const input of [first,last])input.addEventListener('input',()=>{clearTimeout(timer);if(licence&&!club)licence.value='';timer=setTimeout(lookup,450);});
  controllers.push(()=>{clearTimeout(timer);return lookup();});
 }
 return {prepare:()=>Promise.all(controllers.map(f=>f()))};
}

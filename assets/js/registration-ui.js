const tabs=[...document.querySelectorAll('[data-signup-tab]')];
export function selectSignupTab(name){for(const tab of tabs){const active=tab.dataset.signupTab===name;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!active;}document.querySelector('main').scrollTop=0;}
for(const tab of tabs){tab.addEventListener('click',()=>selectSignupTab(tab.dataset.signupTab));tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const target=event.key==='Home'?tabs[0]:event.key==='End'?tabs.at(-1):tabs[(tabs.indexOf(tab)+1)%tabs.length];selectSignupTab(target.dataset.signupTab);target.focus();});}
document.getElementById('paymentLink')?.addEventListener('click',event=>{if(event.currentTarget.getAttribute('aria-disabled')==='true')event.preventDefault();});

const requestedTab=new URLSearchParams(location.search).get('tab');if(['inscription','paiement','partenaire'].includes(requestedTab))selectSignupTab(requestedTab);

const modal=document.getElementById('signup-next');
function next(step){
 const actions=modal.querySelector('.actions');actions.replaceChildren();
 const add=(label,action)=>{const el=document.createElement(typeof action==='string'?'a':'button');el.textContent=label;if(typeof action==='string'){el.href=action;el.className='payment-button';}else{el.type='button';el.onclick=action;}actions.append(el);return el;};
 modal.querySelector('h2').textContent=['Rejoindre le groupe WhatsApp','Payer maintenant ?','Vous pouvez payer plus tard'][step];
 modal.querySelector('p').textContent=['Inscription enregistrée ! Rejoignez le groupe pour suivre les annonces du tournoi.','Inscription enregistrée ! Le tarif est de 10 € par joueur.','Vous pouvez payer en ligne à tout moment depuis l’onglet Paiement, ou en espèces sur place.'][step];
 if(step===0){const a=add('Rejoindre le groupe ↗','https://chat.whatsapp.com/Kk8uAXuZplX1Tw0g2rHtp6');a.target='_blank';a.rel='noopener noreferrer';a.onclick=()=>setTimeout(()=>next(1),0);add('Continuer',()=>next(1));}
 if(step===1){add('Payer maintenant',document.getElementById('paymentLink').href);add('Plus tard',()=>next(2));}
 if(step===2)add('OK',()=>modal.close());
 modal.oncancel=e=>{if(step<2){e.preventDefault();next(step+1);}};
 if(!modal.open)modal.showModal();actions.firstElementChild.focus();
}
document.addEventListener('suzini:registration-next',e=>next(e.detail?0:1));

document.addEventListener('suzini:waitlisted',()=>{next(2);modal.querySelector('h2').textContent='Équipe sur liste d’attente';modal.querySelector('p').textContent='Les huit places sont prises. Attendez que le club confirme votre place avant de payer.';});
